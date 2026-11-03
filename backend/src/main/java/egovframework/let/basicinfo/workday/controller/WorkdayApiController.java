package egovframework.let.basicinfo.workday.controller;

import java.time.LocalDate;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;

import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import egovframework.com.cmm.LoginVO;
import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.EgovUserDetailsHelper;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.let.basicinfo.workday.domain.model.WorkdayGenerateRequestVO;
import egovframework.let.basicinfo.workday.domain.model.WorkdaySaveRequestVO;
import egovframework.let.basicinfo.workday.service.WorkdayService;
import egovframework.let.basicinfo.workday.service.impl.PublicHolidayClient;
import lombok.extern.slf4j.Slf4j;

/**
 * 업무일 관리를 위한 컨트롤러 클래스
 * @author SHMT-MES
 * @since 2026.11.03
 * @version 1.0
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/workday")
public class WorkdayApiController {

    @Resource(name = "workdayService")
    private WorkdayService workdayService;

    @Resource(name = "publicHolidayClient")
    private PublicHolidayClient publicHolidayClient;

    @Resource(name = "resultVoHelper")
    private ResultVoHelper resultVoHelper;

    @GetMapping
    public ResultVO listWorkdays(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestParam int year,
            HttpServletRequest request) throws Exception {
        Map<String, Object> response = new HashMap<String, Object>();
        response.put("items", workdayService.listWorkdays(resolveTenantCode(tenantHeader), year));
        return resultVoHelper.buildFromMap(response, ResponseCode.SUCCESS);
    }

    @PutMapping("/batch")
    public ResultVO saveWorkdays(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestBody WorkdaySaveRequestVO payload,
            HttpServletRequest request) throws Exception {
        payload.setTenantCode(resolveTenantCode(tenantHeader));
        LoginVO operator = currentUser();
        if (operator != null) {
            payload.setOperatorTenantId(operator.getTenantId());
            payload.setOperatorLoginCode(operator.getId());
        }
        workdayService.saveWorkdays(payload);

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("message", "저장되었습니다.");
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @PostMapping("/generate")
    public ResultVO generateWorkdays(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestBody WorkdayGenerateRequestVO payload,
            HttpServletRequest request) throws Exception {
        payload.setTenantCode(resolveTenantCode(tenantHeader));
        LoginVO operator = currentUser();
        if (operator != null) {
            payload.setOperatorTenantId(operator.getTenantId());
            payload.setOperatorLoginCode(operator.getId());
        }
        // 공휴일 API 호출 전에 막을 수 있는 오류(연도, 기존 데이터)를 먼저 확인
        workdayService.checkGeneratable(payload);
        // 외부 API 는 DB 트랜잭션 밖에서 호출
        Map<LocalDate, String> holidays = payload.isIncludePublicHolidays()
                ? publicHolidayClient.fetchHolidays(payload.getYear())
                : Collections.<LocalDate, String>emptyMap();
        workdayService.generateWorkdays(payload, holidays);

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("message", "생성되었습니다.");
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    // ── 헬퍼 ─────────────────────────────────────────

    private LoginVO currentUser() {
        try {
            Object userDetails = EgovUserDetailsHelper.getAuthenticatedUser();
            return userDetails instanceof LoginVO ? (LoginVO) userDetails : null;
        } catch (RuntimeException ex) {
            log.debug("인증 컨텍스트 없음: {}", ex.getMessage());
            return null;
        }
    }

    private String resolveTenantCode(String tenantHeader) {
        if (StringUtils.hasText(tenantHeader)) {
            return tenantHeader.trim().toUpperCase();
        }
        LoginVO user = currentUser();
        if (user != null && StringUtils.hasText(user.getTenantCode())) {
            return user.getTenantCode().trim().toUpperCase();
        }
        return "";
    }
}