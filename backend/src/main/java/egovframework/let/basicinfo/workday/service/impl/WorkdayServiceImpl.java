package egovframework.let.basicinfo.workday.service.impl;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.annotation.Resource;

import org.egovframe.rte.fdl.cmmn.EgovAbstractServiceImpl;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import egovframework.com.cmm.exception.BizException;
import egovframework.let.basicinfo.workday.domain.model.WorkdayGenerateRequestVO;
import egovframework.let.basicinfo.workday.domain.model.WorkdaySaveRequestVO;
import egovframework.let.basicinfo.workday.domain.model.WorkdayVO;
import egovframework.let.basicinfo.workday.domain.repository.WorkdayDAO;
import egovframework.let.basicinfo.workday.service.WorkdayService;

/**
 * 업무일 관리를 위한 서비스 구현 클래스
 * @author SHMT-MES
 * @since 2026.11.03
 * @version 1.0
 */
@Service("workdayService")
public class WorkdayServiceImpl extends EgovAbstractServiceImpl implements WorkdayService {

    static final Set<String> DAY_TYPES = new HashSet<String>(Arrays.asList(
            "WORK", "PUBLIC_HOLIDAY", "COMPANY_HOLIDAY", "SUBSTITUTE_HOLIDAY", "SPECIAL_WORK"));

    private static final int MAX_TEXT_LENGTH = 100;

    @Resource(name = "workdayDAO")
    private WorkdayDAO workdayDAO;

    @Override
    public List<WorkdayVO> listWorkdays(String tenantCode, int year) throws Exception {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", resolveTenantId(tenantCode));
        params.put("year", year);
        return workdayDAO.selectWorkdayList(params);
    }

    @Override
    @Transactional
    public void saveWorkdays(WorkdaySaveRequestVO payload) throws Exception {
        List<WorkdayVO> items = payload.getItems() == null ? Collections.<WorkdayVO>emptyList() : payload.getItems();
        for (WorkdayVO item : items) {
            validateItem(item);
        }
        Long tenantId = resolveTenantId(payload.getTenantCode());
        Long operatorUserId = resolveOperatorUserId(payload.getOperatorTenantId(), payload.getOperatorLoginCode());

        for (WorkdayVO item : items) {
            Map<String, Object> params = new HashMap<String, Object>();
            params.put("tenantId", tenantId);
            params.put("workdayDate", item.getWorkdayDate().trim());
            params.put("dayType", item.getDayType());
            params.put("dayName", normalizeNullable(item.getDayName()));
            params.put("memo", normalizeNullable(item.getMemo()));
            params.put("updatedBy", operatorUserId);
            // 생성 안 된 날짜는 0건 갱신으로 무시
            workdayDAO.updateWorkday(params);
        }
    }

    @Override
    public void checkGeneratable(WorkdayGenerateRequestVO payload) throws Exception {
        validateGenerate(payload.getYear(), payload.getWeeklyOffDays());
        if (payload.isOverwrite()) {
            return;
        }
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", resolveTenantId(payload.getTenantCode()));
        params.put("year", payload.getYear());
        if (workdayDAO.selectWorkdayCount(params) > 0) {
            throw new BizException(payload.getYear() + "년 업무일이 이미 있습니다.");
        }
    }

    @Override
    @Transactional
    public void generateWorkdays(WorkdayGenerateRequestVO payload, Map<LocalDate, String> holidays) throws Exception {
        checkGeneratable(payload);
        Long tenantId = resolveTenantId(payload.getTenantCode());
        Long operatorUserId = resolveOperatorUserId(payload.getOperatorTenantId(), payload.getOperatorLoginCode());
        Set<Integer> offDays = payload.getWeeklyOffDays() == null
                ? Collections.<Integer>emptySet()
                : new HashSet<Integer>(payload.getWeeklyOffDays());

        // ponytail: 365건 행 단위 upsert. 연 1회 관리자 작업이라 배치 insert 는 불필요
        for (WorkdayVO day : buildYear(payload.getYear(), offDays, holidays)) {
            Map<String, Object> params = new HashMap<String, Object>();
            params.put("tenantId", tenantId);
            params.put("workdayDate", day.getWorkdayDate());
            params.put("dayType", day.getDayType());
            params.put("source", day.getSource());
            params.put("dayName", day.getDayName());
            params.put("operatorUserId", operatorUserId);
            workdayDAO.upsertGeneratedWorkday(params);
        }
    }

    private Long resolveTenantId(String tenantCode) throws Exception {
        String normalized = StringUtils.hasText(tenantCode) ? tenantCode.trim().toUpperCase() : "";
        Long tenantId = workdayDAO.selectTenantIdByCode(normalized);
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "테넌트를 찾을 수 없습니다: " + normalized);
        }
        return tenantId;
    }

    private Long resolveOperatorUserId(Long operatorTenantId, String operatorLoginCode) throws Exception {
        if (operatorTenantId == null || !StringUtils.hasText(operatorLoginCode)) {
            return null;
        }
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", operatorTenantId);
        params.put("loginCode", operatorLoginCode.trim());
        return workdayDAO.selectUserIdByLoginCode(params);
    }

    // ── 헬퍼 ─────────────────────────────────────────

    // weeklyOffDays: 0=일 ~ 6=토. 공휴일이 휴무요일보다 우선한다.
    static List<WorkdayVO> buildYear(int year, Set<Integer> weeklyOffDays, Map<LocalDate, String> holidays) {
        List<WorkdayVO> days = new ArrayList<WorkdayVO>();
        for (LocalDate date = LocalDate.of(year, 1, 1); date.getYear() == year; date = date.plusDays(1)) {
            WorkdayVO day = new WorkdayVO();
            day.setWorkdayDate(date.toString());
            String holidayName = holidays.get(date);
            if (holidayName != null) {
                day.setDayType(holidayName.contains("대체") ? "SUBSTITUTE_HOLIDAY" : "PUBLIC_HOLIDAY");
                day.setDayName(holidayName);
                day.setSource("API");
            } else {
                // DayOfWeek: 월=1 ~ 일=7 → %7 로 일=0 ~ 토=6
                day.setDayType(weeklyOffDays.contains(date.getDayOfWeek().getValue() % 7) ? "COMPANY_HOLIDAY" : "WORK");
                day.setSource("PATTERN");
            }
            days.add(day);
        }
        return days;
    }

    static void validateItem(WorkdayVO item) {
        if (item == null || !StringUtils.hasText(item.getWorkdayDate())) {
            throw new IllegalArgumentException("날짜는 필수입니다.");
        }
        try {
            LocalDate.parse(item.getWorkdayDate().trim());
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("날짜 형식이 올바르지 않습니다: " + item.getWorkdayDate());
        }
        if (!DAY_TYPES.contains(item.getDayType())) {
            throw new IllegalArgumentException("지원하지 않는 유형입니다: " + item.getDayType());
        }
        if (length(item.getDayName()) > MAX_TEXT_LENGTH) {
            throw new IllegalArgumentException("휴일명은 100자까지 입력할 수 있습니다.");
        }
        if (length(item.getMemo()) > MAX_TEXT_LENGTH) {
            throw new IllegalArgumentException("메모는 100자까지 입력할 수 있습니다.");
        }
    }

    static void validateGenerate(Integer year, List<Integer> weeklyOffDays) {
        if (year == null || year < 2000 || year > 2100) {
            throw new IllegalArgumentException("연도는 2000 ~ 2100 사이여야 합니다.");
        }
        if (weeklyOffDays != null) {
            for (Integer day : weeklyOffDays) {
                if (day == null || day < 0 || day > 6) {
                    throw new IllegalArgumentException("휴무 요일은 0(일) ~ 6(토) 이어야 합니다.");
                }
            }
        }
    }

    private static int length(String value) {
        return value == null ? 0 : value.trim().length();
    }

    static String normalizeNullable(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}