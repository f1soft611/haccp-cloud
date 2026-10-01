package egovframework.let.platform_admin.tenants.service.impl;

import java.time.Instant;
import java.util.List;
import java.util.regex.Pattern;

import javax.annotation.Resource;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import egovframework.let.platform_admin.tenants.domain.model.PlatformTenantDashboardItemVO;
import egovframework.let.platform_admin.tenants.domain.model.PlatformTenantDashboardQueryVO;
import egovframework.let.platform_admin.tenants.domain.model.PlatformTenantDashboardResultVO;
import egovframework.let.platform_admin.tenants.domain.model.PlatformTenantDashboardSummaryVO;
import egovframework.let.platform_admin.tenants.domain.model.SampleTenantVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantRegistrationRequestVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantRegistrationResultVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantVO;
import egovframework.let.platform_admin.tenants.domain.repository.TenantInfoDAO;
import egovframework.let.platform_admin.tenants.service.PlatformTenantService;
import egovframework.let.platform_admin.tenants.service.TenantDatabaseProvisioningService;
import egovframework.let.platform_admin.access.domain.repository.PlanAccessDAO;

/**
 * 플랫폼 테넌트 서비스 구현체
 * @author SHMT-MES
 * @since 2026.06.22
 * @version 1.0
 * @see
 *
 * <pre>
 * << 개정이력(Modification Information) >>
 *
 *   수정일      수정자           수정내용
 *  -------    --------    ---------------------------
 *   2026.06.22 SHMT-MES          최초 생성
 *
 * </pre>
 */
@Service("platformTenantService")
public class PlatformTenantServiceImpl implements PlatformTenantService {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    @Resource(name = "tenantInfoDAO")
    private TenantInfoDAO tenantInfoDAO;

    @Resource(name = "tenantDatabaseProvisioningService")
    private TenantDatabaseProvisioningService tenantDatabaseProvisioningService;

    @Resource(name = "planAccessDAO")
    private PlanAccessDAO planAccessDAO;

    @Override
    @Transactional
    public TenantRegistrationResultVO registerTenant(TenantRegistrationRequestVO requestVO) {
        validateRequest(requestVO);

        String tenantNm = requestVO.getTenantNm().trim();
        String adminEmail = emptyToNull(requestVO.getAdminEmail());
        String adminName = emptyToNull(requestVO.getAdminName());
        String businessRegistrationNumber = emptyToNull(requestVO.getBusinessRegistrationNumber());
        String corporateNumber = emptyToNull(requestVO.getCorporateNumber());
        String normalizedCorporateNumber = normalizeCorporateNumber(corporateNumber);
        String businessType = emptyToNull(requestVO.getBusinessType());
        String businessCategory = emptyToNull(requestVO.getBusinessCategory());
        String registrationDate = emptyToNull(requestVO.getRegistrationDate());
        String planCode = emptyToNull(requestVO.getPlanCode());

        String normalizedBusinessRegistrationNumber = normalizeBusinessRegistrationNumber(businessRegistrationNumber);
        String tenantSerialCode = normalizedBusinessRegistrationNumber;
        String tenantCode = tenantSerialCode;
        String tenantDbName = "tenant_" + tenantSerialCode;

        boolean tenantDatabaseMetaExists = tenantInfoDAO.selectTenantDatabaseCountByDbName(tenantDbName) > 0;
        boolean tenantDatabasePhysicalExists = tenantDatabaseProvisioningService != null
                && tenantDatabaseProvisioningService.databaseExists(tenantDbName);
        boolean tenantDatabaseAlreadyExists = tenantDatabaseMetaExists || tenantDatabasePhysicalExists;

        if (normalizedCorporateNumber != null) {
            int activeDuplicateCount = tenantInfoDAO.selectActiveTenantCountByCorporateNumber(normalizedCorporateNumber);
            if (activeDuplicateCount > 0) {
                throw new IllegalStateException("이미 등록된 활성 업체의 법인번호입니다");
            }
        }

        if (normalizedBusinessRegistrationNumber != null) {
            int activeDuplicateCount = tenantInfoDAO.selectActiveTenantCountByBusinessRegistrationNumber(normalizedBusinessRegistrationNumber);
            if (activeDuplicateCount > 0) {
                throw new IllegalStateException("이미 등록된 활성 업체의 사업자번호입니다");
            }
        }

        tenantInfoDAO.insertTenantWithBusinessInfo(
            tenantSerialCode,
            tenantNm,
            adminEmail,
            businessRegistrationNumber,
            corporateNumber,
            businessType,
            businessCategory,
            registrationDate);

        Long existingTenantId = tenantInfoDAO.selectTenantIdByCode(tenantSerialCode);

        if (existingTenantId != null && tenantInfoDAO.selectTenantDatabaseCountByDbName(tenantDbName) == 0) {
            tenantInfoDAO.insertTenantDatabase(existingTenantId, tenantCode, tenantDbName, "public");
        }

        if (!tenantDatabaseAlreadyExists && existingTenantId != null && tenantDatabaseProvisioningService != null) {
            List<String> planMenuCodes = resolvePlanMenuCodes(planCode);
            tenantDatabaseProvisioningService.provisionNewTenantDatabase(
                existingTenantId, tenantCode, tenantDbName, "public", planCode, planMenuCodes);
        }

        if (existingTenantId != null && planCode != null) {
            tenantInfoDAO.expireActiveTenantSubscription(existingTenantId);
            int inserted = tenantInfoDAO.insertActiveTenantSubscriptionByPlanCode(existingTenantId, planCode.trim().toUpperCase());
            if (inserted <= 0) {
                throw new IllegalStateException("유효하지 않은 플랜 코드입니다");
            }
        }

        TenantRegistrationResultVO resultVO = buildTenantRegistrationResult(
            existingTenantId,
            tenantCode,
            tenantNm,
            adminEmail,
            businessRegistrationNumber,
            corporateNumber,
            businessType,
            businessCategory,
            registrationDate,
            planCode);
        resultVO.setAdminName(adminName);
        return resultVO;
    }

    private TenantRegistrationResultVO buildTenantRegistrationResult(
            Long tenantId,
            String tenantCode,
            String tenantNm,
            String adminEmail,
            String businessRegistrationNumber,
            String corporateNumber,
            String businessType,
            String businessCategory,
            String registrationDate,
            String planCode) {
        TenantRegistrationResultVO resultVO = new TenantRegistrationResultVO();
        resultVO.setTenantId(tenantId);
        resultVO.setTenantCode(tenantCode);
        resultVO.setTenantNm(tenantNm);
        resultVO.setAdminEmail(adminEmail);
        resultVO.setBusinessRegistrationNumber(businessRegistrationNumber);
        resultVO.setCorporateNumber(corporateNumber);
        resultVO.setBusinessType(businessType);
        resultVO.setBusinessCategory(businessCategory);
        resultVO.setRegistrationDate(registrationDate);
        resultVO.setPlanCode(planCode);
        resultVO.setCreatedAt(Instant.now().toString());
        return resultVO;
    }

    private List<String> resolvePlanMenuCodes(String planCode) {
        if (planAccessDAO == null || planCode == null || planCode.trim().isEmpty()) {
            return java.util.Collections.emptyList();
        }

        try {
            return planAccessDAO.selectPlanMenuCodes(planCode.trim().toUpperCase());
        } catch (Exception ex) {
            throw new IllegalStateException("플랜별 메뉴 조회에 실패했습니다. planCode=" + planCode, ex);
        }
    }

    @Override
    @Transactional
    public void updateOnboardingStatusByTenantCode(String tenantCode, String onboardingStatus) {
        String normalizedTenantCode = normalizeStorageTenantCode(tenantCode);
        String normalizedOnboardingStatus = normalizeOnboardingTransitionStatus(onboardingStatus);
        tenantInfoDAO.updateOnboardingStatusByTenantCode(normalizedTenantCode, normalizedOnboardingStatus);
    }

    @Override
    public PlatformTenantDashboardResultVO listDashboardTenants(
            PlatformTenantDashboardQueryVO queryVO) {
        PlatformTenantDashboardQueryVO condition = normalizeQuery(queryVO);

        int total = tenantInfoDAO.selectTenantCount(condition, null);
        int active = tenantInfoDAO.selectTenantCount(condition, "Y");
        int inactive = tenantInfoDAO.selectTenantCount(condition, "N");
        List<PlatformTenantDashboardItemVO> items = tenantInfoDAO.selectDashboardTenantItems(condition);

        PlatformTenantDashboardSummaryVO summary = new PlatformTenantDashboardSummaryVO();
        summary.setTotal(total);
        summary.setActive(active);
        summary.setInactive(inactive);

        PlatformTenantDashboardResultVO result = new PlatformTenantDashboardResultVO();
        result.setSummary(summary);
        result.setItems(items);
        return result;
    }

    @Override
    public PlatformTenantDashboardItemVO findDashboardTenantByCode(String tenantCode) {
        String normalized = emptyToNull(tenantCode);
        if (normalized == null) {
            throw new IllegalArgumentException("tenantCode is required");
        }

        PlatformTenantDashboardItemVO item = tenantInfoDAO.selectDashboardTenantItemByCode(normalized);
        if (item != null) {
            return item;
        }

        if (normalized.startsWith("TENANT_")) {
            item = tenantInfoDAO.selectDashboardTenantItemByCode(normalized.substring("TENANT_".length()));
        }

        return item;
    }

    @Override
    public List<SampleTenantVO> listRecentTenants(int limit) {
        return tenantInfoDAO.selectRecentTenants(limit);
    }

    @Override
    public TenantVO findByAdminEmailDomain(String domain) {
        if (domain == null || domain.trim().isEmpty()) {
            throw new IllegalArgumentException("domain is required");
        }

        String normalizedDomain = domain.trim();
        TenantVO tenant = tenantInfoDAO.selectByAdminEmailDomain(normalizedDomain);

        if (tenant == null) {
            throw new IllegalArgumentException("Tenant not found for domain: " + normalizedDomain);
        }

        return tenant;
    }

    @Override
    public TenantVO findById(Long tenantId) {
        if (tenantId == null || tenantId <= 0) {
            throw new IllegalArgumentException("tenantId is required and must be positive");
        }

        TenantVO tenant = tenantInfoDAO.selectById(tenantId);

        if (tenant == null) {
            throw new IllegalArgumentException("Tenant not found for tenantId: " + tenantId);
        }

        return tenant;
    }

    @Override
    @Transactional
    public void updateLogoImage(Long tenantId, String logoImage) {
        if (tenantId == null || tenantId <= 0) {
            throw new IllegalArgumentException("tenantId is required and must be positive");
        }

        // logoImage는 null이거나 Base64 문자열이어야 함
        if (logoImage != null && logoImage.trim().isEmpty()) {
            logoImage = null;
        }

        int result = tenantInfoDAO.updateLogoImage(tenantId, logoImage);
        if (result == 0) {
            throw new IllegalArgumentException("Failed to update logo image for tenantId: " + tenantId);
        }
    }

    private PlatformTenantDashboardQueryVO normalizeQuery(PlatformTenantDashboardQueryVO queryVO) {
        PlatformTenantDashboardQueryVO normalized = new PlatformTenantDashboardQueryVO();
        if (queryVO == null) {
            return normalized;
        }

        normalized.setPageIndex(Math.max(0, queryVO.getPageIndex()));
        int pageSize = queryVO.getPageSize();
        if (pageSize <= 0) {
            pageSize = 10;
        }
        if (pageSize > 100) {
            pageSize = 100;
        }
        normalized.setPageSize(pageSize);
        normalized.setSearchField(emptyToNull(queryVO.getSearchField()));
        normalized.setSearchKeyword(emptyToNull(queryVO.getSearchKeyword()));
        normalized.setStatus(normalizeUseStatus(queryVO.getStatus()));
        normalized.setOnboardingStatus(normalizeOnboardingStatus(queryVO.getOnboardingStatus()));
        return normalized;
    }

    private String normalizeUseStatus(String status) {
        String normalized = emptyToNull(status);
        if (normalized == null) {
            return "all";
        }

        String upper = normalized.toUpperCase();
        if ("ACTIVE".equals(upper)
                || "INACTIVE".equals(upper)
                || "ALL".equals(upper)) {
            return upper;
        }

        return "all";
    }

    private String normalizeOnboardingStatus(String onboardingStatus) {
        String normalized = emptyToNull(onboardingStatus);
        if (normalized == null) {
            return "all";
        }

        String upper = normalized.toUpperCase();
        if ("EMAIL_QUEUED".equals(upper)
                || "EMAIL_SENT".equals(upper)
                || "EMAIL_VERIFIED".equals(upper)
                || "FIRST_SETUP_COMPLETED".equals(upper)
                || "ACTIVE".equals(upper)
                || "ALL".equals(upper)) {
            return upper;
        }

        return "all";
    }

    private String normalizeOnboardingTransitionStatus(String onboardingStatus) {
        String normalized = emptyToNull(onboardingStatus);
        if (normalized == null) {
            throw new IllegalArgumentException("onboardingStatus is required");
        }

        String upper = normalized.toUpperCase();
        if ("EMAIL_QUEUED".equals(upper)
                || "EMAIL_SENT".equals(upper)
                || "EMAIL_VERIFIED".equals(upper)
                || "FIRST_SETUP_COMPLETED".equals(upper)
                || "ACTIVE".equals(upper)) {
            return upper;
        }

        throw new IllegalArgumentException("unsupported onboardingStatus");
    }

    private String normalizeStorageTenantCode(String tenantCode) {
        String normalized = emptyToNull(tenantCode);
        if (normalized == null) {
            throw new IllegalArgumentException("tenantCode is required");
        }
        if (normalized.startsWith("TENANT_")) {
            return normalized.substring("TENANT_".length());
        }
        return normalized;
    }

    private void validateRequest(TenantRegistrationRequestVO requestVO) {
        if (requestVO == null || requestVO.getTenantNm() == null || requestVO.getTenantNm().trim().isEmpty()) {
            throw new IllegalArgumentException("tenantNm is required");
        }
        if (requestVO.getBusinessType() == null || requestVO.getBusinessType().trim().isEmpty()) {
            throw new IllegalArgumentException("businessType is required");
        }
        if (requestVO.getBusinessCategory() == null || requestVO.getBusinessCategory().trim().isEmpty()) {
            throw new IllegalArgumentException("businessCategory is required");
        }
        String businessRegistrationNumber = requestVO.getBusinessRegistrationNumber();
        if (businessRegistrationNumber == null || businessRegistrationNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("businessRegistrationNumber is required");
        }
        if (!businessRegistrationNumber.replaceAll("[^0-9]", "").matches("[0-9]{10}")) {
            throw new IllegalArgumentException("businessRegistrationNumber format is invalid");
        }
        String adminEmail = requestVO.getAdminEmail();
        if (adminEmail == null || adminEmail.trim().isEmpty()) {
            throw new IllegalArgumentException("adminEmail is required");
        }
        if (!EMAIL_PATTERN.matcher(adminEmail.trim()).matches()) {
            throw new IllegalArgumentException("adminEmail format is invalid");
        }
    }

    private String normalizeBusinessRegistrationNumber(String businessRegistrationNumber) {
        return businessRegistrationNumber.replaceAll("[^0-9]", "");
    }

    private String normalizeCorporateNumber(String corporateNumber) {
        if (corporateNumber == null || corporateNumber.trim().isEmpty()) {
            return null;
        }

        String normalized = corporateNumber.replaceAll("[^0-9]", "");
        if (normalized.length() == 10 || normalized.length() == 13) {
            return normalized;
        }
        throw new IllegalArgumentException("corporateNumber format is invalid");
    }

    private String emptyToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
