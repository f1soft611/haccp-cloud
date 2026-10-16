package egovframework.let.documents.workorder.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;

import org.egovframe.rte.fdl.cmmn.EgovAbstractServiceImpl;
import org.egovframe.rte.ptl.mvc.tags.ui.pagination.PaginationInfo;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import egovframework.let.documents.workorder.domain.model.WorkOrderSaveRequestVO;
import egovframework.let.documents.workorder.domain.model.WorkOrderSearchConditionVO;
import egovframework.let.documents.workorder.domain.model.WorkOrderVO;
import egovframework.let.documents.workorder.domain.repository.WorkOrderDAO;
import egovframework.let.documents.workorder.service.WorkOrderService;

/**
 * 작업지시 관리를 위한 서비스 구현 클래스
 * @author SHMT-MES
 * @since 2026.10.15
 * @version 1.0
 */
@Service("workOrderService")
public class WorkOrderServiceImpl extends EgovAbstractServiceImpl implements WorkOrderService {

    private static final int MAX_WORKDT_SEQ = 9999;
    private static final BigDecimal MAX_PRODPLAN_QTY = new BigDecimal("100000"); // numeric(10,5) 정수부 5자리
    private static final int MAX_PROD_MEMO_LENGTH = 255;
    private static final DateTimeFormatter WORKDT_NO_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");

    @Resource(name = "workOrderDAO")
    private WorkOrderDAO workOrderDAO;

    @Override
    public Map<String, Object> listWorkOrdersPaged(int pageIndex, int pageSize, String startDate, String endDate,
                                                   String keyword, String tenantCode) throws Exception {
        WorkOrderSearchConditionVO condition = new WorkOrderSearchConditionVO();
        condition.setPageIndex(pageIndex);
        condition.setPageSize(pageSize);
        condition.setKeyword(normalizeNullable(keyword));
        condition.setStartDate(parseOptionalDate(startDate));
        condition.setEndDate(parseOptionalDate(endDate));
        condition.setTenantCode(normalizeTenantCode(tenantCode));

        PaginationInfo paginationInfo = new PaginationInfo();
        paginationInfo.setCurrentPageNo(condition.getPageIndex());
        paginationInfo.setRecordCountPerPage(condition.getPageSize());
        paginationInfo.setPageSize(condition.getPageSize());

        condition.setFirstIndex(paginationInfo.getFirstRecordIndex());
        condition.setLastIndex(paginationInfo.getLastRecordIndex());
        condition.setRecordCountPerPage(paginationInfo.getRecordCountPerPage());

        List<WorkOrderVO> workOrderList = workOrderDAO.selectWorkOrderPagedList(condition);
        int totalCount = workOrderDAO.selectWorkOrderPagedCount(condition);
        paginationInfo.setTotalRecordCount(totalCount);

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("workOrderList", workOrderList);
        resultMap.put("totalCount", totalCount);
        resultMap.put("paginationInfo", paginationInfo);
        return resultMap;
    }

    @Override
    @Transactional
    public WorkOrderVO createWorkOrder(WorkOrderSaveRequestVO payload) throws Exception {
        validate(payload);
        Long tenantId = resolveTenantId(normalizeTenantCode(payload.getTenantCode()));
        requireActiveMaterial(tenantId, payload.getMaterialId());

        LocalDate today = LocalDate.now();
        String datePrefix = today.format(WORKDT_NO_DATE);

        // 테넌트 단위 잠금 후 당일 최대 번호를 조회해 다음 번호를 채번한다(동시 등록 시 번호 중복 방지).
        workOrderDAO.lockTenantForNoGeneration(tenantId);
        Map<String, Object> maxParams = new HashMap<String, Object>();
        maxParams.put("tenantId", tenantId);
        maxParams.put("datePrefix", datePrefix);
        String workdtNo = nextWorkdtNo(datePrefix, workOrderDAO.selectMaxWorkdtNo(maxParams));

        String operatorUserId = resolveOperatorUserId(payload);
        Map<String, Object> params = buildParams(payload);
        params.put("tenantId", tenantId);
        params.put("workdtNo", workdtNo);
        params.put("workdtDate", today.toString());
        params.put("createdBy", operatorUserId);
        params.put("updatedBy", operatorUserId);

        Long newId = workOrderDAO.insertWorkOrder(params);
        return findWorkOrder(newId, tenantId);
    }

    @Override
    @Transactional
    public WorkOrderVO updateWorkOrder(Long workdirectId, WorkOrderSaveRequestVO payload) throws Exception {
        validate(payload);
        Long tenantId = resolveTenantId(normalizeTenantCode(payload.getTenantCode()));
        requireActiveMaterial(tenantId, payload.getMaterialId());

        Map<String, Object> params = buildParams(payload);
        params.put("workdirectId", workdirectId);
        params.put("tenantId", tenantId);
        params.put("updatedBy", resolveOperatorUserId(payload));
        if (workOrderDAO.updateWorkOrder(params) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "작업지시를 찾을 수 없습니다.");
        }
        return findWorkOrder(workdirectId, tenantId);
    }

    @Override
    @Transactional
    public void deleteWorkOrder(Long workdirectId, WorkOrderSaveRequestVO payload) throws Exception {
        Long tenantId = resolveTenantId(normalizeTenantCode(payload.getTenantCode()));

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("workdirectId", workdirectId);
        params.put("tenantId", tenantId);
        params.put("updatedBy", resolveOperatorUserId(payload));
        if (workOrderDAO.softDeleteWorkOrder(params) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "작업지시를 찾을 수 없습니다.");
        }
    }

    // ── 검증/채번 (단위 테스트 대상) ─────────────────────

    static void validate(WorkOrderSaveRequestVO payload) {
        if (payload.getMaterialId() == null) {
            throw new IllegalArgumentException("품목을 선택하세요.");
        }
        LocalDate prodPlanDate = parseRequiredDate(payload.getProdPlanDate(), "생산계획일을 입력하세요.");
        LocalDate expirationDate = parseRequiredDate(payload.getExpirationDate(), "소비기한을 입력하세요.");
        if (expirationDate.isBefore(prodPlanDate)) {
            throw new IllegalArgumentException("소비기한은 생산계획일 이후여야 합니다.");
        }
        BigDecimal qty = payload.getProdplanQty();
        if (qty == null || qty.signum() <= 0) {
            throw new IllegalArgumentException("생산량은 0보다 커야 합니다.");
        }
        if (qty.compareTo(MAX_PRODPLAN_QTY) >= 0) {
            throw new IllegalArgumentException("생산량은 99999.99999 이하로 입력하세요.");
        }
        if (payload.getProdMemo() != null && payload.getProdMemo().trim().length() > MAX_PROD_MEMO_LENGTH) {
            throw new IllegalArgumentException("비고는 255자 이하로 입력하세요.");
        }
    }

    /** 등록일 yyyyMMdd + 4자리 순번. maxNo는 같은 테넌트·같은 날짜의 최대 번호(없으면 null). */
    static String nextWorkdtNo(String datePrefix, String maxNo) {
        int next = 1;
        if (StringUtils.hasText(maxNo) && maxNo.startsWith(datePrefix)) {
            next = Integer.parseInt(maxNo.substring(datePrefix.length())) + 1;
        }
        if (next > MAX_WORKDT_SEQ) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "작업지시번호 채번 가능 범위를 초과했습니다.");
        }
        return datePrefix + String.format("%04d", next);
    }

    private static LocalDate parseRequiredDate(String value, String emptyMessage) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalArgumentException(emptyMessage);
        }
        try {
            return LocalDate.parse(value.trim());
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("날짜 형식이 올바르지 않습니다: " + value.trim());
        }
    }

    // ── 헬퍼 ─────────────────────────────────────────

    private Map<String, Object> buildParams(WorkOrderSaveRequestVO payload) {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("materialId", payload.getMaterialId());
        params.put("prodPlanDate", payload.getProdPlanDate().trim());
        params.put("expirationDate", payload.getExpirationDate().trim());
        params.put("prodplanQty", payload.getProdplanQty());
        params.put("prodMemo", normalizeNullable(payload.getProdMemo()));
        return params;
    }

    private WorkOrderVO findWorkOrder(Long workdirectId, Long tenantId) throws Exception {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("workdirectId", workdirectId);
        params.put("tenantId", tenantId);
        WorkOrderVO found = workOrderDAO.selectWorkOrderById(params);
        if (found == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "작업지시를 찾을 수 없습니다.");
        }
        return found;
    }

    private void requireActiveMaterial(Long tenantId, Long materialId) throws Exception {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("materialId", materialId);
        if (workOrderDAO.selectActiveMaterialCount(params) == 0) {
            throw new IllegalArgumentException("품목을 찾을 수 없습니다.");
        }
    }

    /** 검색 조건 날짜: 비어 있으면 null, 형식 오류면 400 */
    private String parseOptionalDate(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            return LocalDate.parse(value.trim()).toString();
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "날짜 형식이 올바르지 않습니다: " + value.trim());
        }
    }

    private String resolveOperatorUserId(WorkOrderSaveRequestVO payload) throws Exception {
        if (payload.getOperatorTenantId() == null || !StringUtils.hasText(payload.getOperatorLoginCode())) {
            return null;
        }
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", payload.getOperatorTenantId());
        params.put("loginCode", payload.getOperatorLoginCode().trim());
        Long userId = workOrderDAO.selectUserIdByLoginCode(params);
        return userId != null ? String.valueOf(userId) : null;
    }

    private Long resolveTenantId(String tenantCode) throws Exception {
        Long tenantId = workOrderDAO.selectTenantIdByCode(tenantCode);
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "테넌트를 찾을 수 없습니다: " + tenantCode);
        }
        return tenantId;
    }

    private String normalizeTenantCode(String tenantCode) {
        return StringUtils.hasText(tenantCode) ? tenantCode.trim().toUpperCase() : "";
    }

    private String normalizeNullable(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}