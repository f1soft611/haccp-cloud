package egovframework.let.basicinfo.customers.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import javax.annotation.Resource;

import org.egovframe.rte.fdl.cmmn.EgovAbstractServiceImpl;
import org.egovframe.rte.ptl.mvc.tags.ui.pagination.PaginationInfo;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import egovframework.let.basicinfo.customers.domain.model.CustomerSaveRequestVO;
import egovframework.let.basicinfo.customers.domain.model.CustomerSearchConditionVO;
import egovframework.let.basicinfo.customers.domain.model.CustomerVO;
import egovframework.let.basicinfo.customers.domain.repository.CustomerDAO;
import egovframework.let.basicinfo.customers.service.CustomerService;

/**
 * 거래처 관리를 위한 서비스 구현 클래스
 * @author SHMT-MES
 * @since 2026.08.14
 * @version 1.0
 */
@Service("customerService")
public class CustomerServiceImpl extends EgovAbstractServiceImpl implements CustomerService {

    private static final Pattern BUSINESS_NO_PATTERN = Pattern.compile("^\\d{10}$");
    private static final Pattern CORP_NO_PATTERN = Pattern.compile("^\\d{13}$");
    private static final int MAX_CUSTOMER_CODE = 999999;

    @Resource(name = "customerDAO")
    private CustomerDAO customerDAO;

    @Override
    public Map<String, Object> listCustomersPaged(int pageIndex, int pageSize, String keyword, String filterActive, String tenantCode) throws Exception {
        CustomerSearchConditionVO condition = new CustomerSearchConditionVO();
        condition.setPageIndex(pageIndex);
        condition.setPageSize(pageSize);
        condition.setKeyword(normalizeNullable(keyword));
        condition.setFilterActive(normalizeFilterActive(filterActive));
        condition.setTenantCode(normalizeTenantCode(tenantCode));

        PaginationInfo paginationInfo = new PaginationInfo();
        paginationInfo.setCurrentPageNo(condition.getPageIndex());
        paginationInfo.setRecordCountPerPage(condition.getPageSize());
        paginationInfo.setPageSize(condition.getPageSize());

        condition.setFirstIndex(paginationInfo.getFirstRecordIndex());
        condition.setLastIndex(paginationInfo.getLastRecordIndex());
        condition.setRecordCountPerPage(paginationInfo.getRecordCountPerPage());

        List<CustomerVO> customerList = customerDAO.selectCustomerPagedList(condition);
        int totalCount = customerDAO.selectCustomerPagedCount(condition);
        paginationInfo.setTotalRecordCount(totalCount);

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("customerList", customerList);
        resultMap.put("totalCount", totalCount);
        resultMap.put("paginationInfo", paginationInfo);
        return resultMap;
    }

    @Override
    @Transactional
    public CustomerVO createCustomer(CustomerSaveRequestVO payload) throws Exception {
        String tenantCode = normalizeTenantCode(payload.getTenantCode());
        if (!StringUtils.hasText(payload.getCustomerName())) {
            throw new IllegalArgumentException("거래처명은 필수입니다.");
        }
        validateBusinessNo(payload.getBusinessNo());
        validateCorpNo(payload.getJuridNo());

        Long tenantId = resolveTenantId(tenantCode);

        // 테넌트 단위로 잠금을 건 뒤 최대 코드를 조회해 다음 코드를 채번한다(동시 등록 시 코드 중복 방지).
        customerDAO.lockTenantForCodeGeneration(tenantId);
        String nextCustomerCode = generateNextCustomerCode(customerDAO.selectMaxCustomerCode(tenantId));

        String operatorUserId = resolveOperatorUserId(payload);

        Map<String, Object> params = buildParams(payload);
        params.put("tenantId", tenantId);
        params.put("customerCode", nextCustomerCode);
        params.put("useAt", Boolean.FALSE.equals(payload.getActive()) ? "N" : "Y");
        params.put("createdBy", operatorUserId);
        params.put("updatedBy", operatorUserId);

        Long newId = customerDAO.insertCustomer(params);

        Map<String, Object> lookupParams = new HashMap<String, Object>();
        lookupParams.put("customerId", newId);
        lookupParams.put("tenantId", tenantId);
        return customerDAO.selectCustomerById(lookupParams);
    }

    @Override
    @Transactional
    public CustomerVO updateCustomer(Long customerId, CustomerSaveRequestVO payload) throws Exception {
        String tenantCode = normalizeTenantCode(payload.getTenantCode());
        if (!StringUtils.hasText(payload.getCustomerName())) {
            throw new IllegalArgumentException("거래처명은 필수입니다.");
        }
        validateBusinessNo(payload.getBusinessNo());
        validateCorpNo(payload.getJuridNo());

        Long tenantId = resolveTenantId(tenantCode);

        Map<String, Object> params = buildParams(payload);
        params.put("customerId", customerId);
        params.put("tenantId", tenantId);
        params.put("useAt", Boolean.FALSE.equals(payload.getActive()) ? "N" : "Y");
        params.put("updatedBy", resolveOperatorUserId(payload));
        customerDAO.updateCustomer(params);

        Map<String, Object> lookupParams = new HashMap<String, Object>();
        lookupParams.put("customerId", customerId);
        lookupParams.put("tenantId", tenantId);
        CustomerVO updated = customerDAO.selectCustomerById(lookupParams);
        if (updated == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "거래처를 찾을 수 없습니다.");
        }
        return updated;
    }

    @Override
    @Transactional
    public void deleteCustomer(Long customerId, String tenantCode) throws Exception {
        Long tenantId = resolveTenantId(normalizeTenantCode(tenantCode));

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("customerId", customerId);
        params.put("tenantId", tenantId);
        customerDAO.deleteCustomer(params);
    }

    // ── 헬퍼 ─────────────────────────────────────────

    private Map<String, Object> buildParams(CustomerSaveRequestVO payload) {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("customerName", payload.getCustomerName().trim());
        params.put("custNameAbbr", normalizeNullable(payload.getCustNameAbbr()));
        params.put("presidentName", normalizeNullable(payload.getPresidentName()));
        params.put("businessNo", normalizeDigitsOnly(payload.getBusinessNo()));
        params.put("juridNo", normalizeDigitsOnly(payload.getJuridNo()));
        params.put("businessStatus1", normalizeNullable(payload.getBusinessStatus1()));
        params.put("businessItem1", normalizeNullable(payload.getBusinessItem1()));
        params.put("postCode", normalizeNullable(payload.getPostCode()));
        params.put("address", normalizeNullable(payload.getAddress()));
        params.put("telephoneNo", normalizeNullable(payload.getTelephoneNo()));
        params.put("facsimileNo", normalizeNullable(payload.getFacsimileNo()));
        params.put("custMemo", normalizeNullable(payload.getCustMemo()));
        return params;
    }

    private String generateNextCustomerCode(String maxCode) {
        int next = 1;
        if (StringUtils.hasText(maxCode)) {
            try {
                next = Integer.parseInt(maxCode.trim()) + 1;
            } catch (NumberFormatException ex) {
                next = 1;
            }
        }
        if (next > MAX_CUSTOMER_CODE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "거래처코드 채번 가능 범위를 초과했습니다.");
        }
        return String.format("%06d", next);
    }

    private void validateBusinessNo(String businessNo) {
        String digitsOnly = normalizeDigitsOnly(businessNo);
        if (digitsOnly == null) {
            return;
        }
        if (!BUSINESS_NO_PATTERN.matcher(digitsOnly).matches()) {
            throw new IllegalArgumentException("사업자번호는 숫자 10자리여야 합니다.");
        }
    }

    private void validateCorpNo(String juridNo) {
        String digitsOnly = normalizeDigitsOnly(juridNo);
        if (digitsOnly == null) {
            return;
        }
        if (!CORP_NO_PATTERN.matcher(digitsOnly).matches()) {
            throw new IllegalArgumentException("법인번호는 숫자 13자리여야 합니다.");
        }
    }

    private String normalizeDigitsOnly(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String digitsOnly = value.replaceAll("\\D", "");
        return digitsOnly.isEmpty() ? null : digitsOnly;
    }

    private String resolveOperatorUserId(CustomerSaveRequestVO payload) throws Exception {
        if (payload.getOperatorTenantId() == null || !StringUtils.hasText(payload.getOperatorLoginCode())) {
            return null;
        }
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", payload.getOperatorTenantId());
        params.put("loginCode", payload.getOperatorLoginCode().trim());
        Long userId = customerDAO.selectUserIdByLoginCode(params);
        return userId != null ? String.valueOf(userId) : null;
    }

    private Long resolveTenantId(String tenantCode) throws Exception {
        Long tenantId = customerDAO.selectTenantIdByCode(tenantCode);
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

    private String normalizeFilterActive(String filterActive) {
        if (!StringUtils.hasText(filterActive)) {
            return "all";
        }
        String upper = filterActive.trim().toUpperCase();
        return ("Y".equals(upper) || "N".equals(upper)) ? upper : "all";
    }
}
