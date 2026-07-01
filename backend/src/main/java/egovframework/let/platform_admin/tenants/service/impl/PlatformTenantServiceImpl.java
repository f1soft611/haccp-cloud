package egovframework.let.platform_admin.tenants.service.impl;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
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

/**
 * 플랫폼 테넌트 서비스 구현체
 */
@Service("platformTenantService")
public class PlatformTenantServiceImpl implements PlatformTenantService {

    private static final DateTimeFormatter TENANT_CODE_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyMMdd");
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Seoul");
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    @Resource(name = "tenantInfoDAO")
    private TenantInfoDAO tenantInfoDAO;

    @Override
    @Transactional
    public TenantRegistrationResultVO registerTenant(TenantRegistrationRequestVO requestVO) {
        validateRequest(requestVO);

        String tenantNm = requestVO.getTenantNm().trim();
        String adminEmail = emptyToNull(requestVO.getAdminEmail());
        String corporateNumber = emptyToNull(requestVO.getCorporateNumber());
        String normalizedCorporateNumber = normalizeCorporateNumber(corporateNumber);
        String businessType = emptyToNull(requestVO.getBusinessType());
        String businessCategory = emptyToNull(requestVO.getBusinessCategory());

        int activeDuplicateCount = tenantInfoDAO.selectActiveTenantCountByCorporateNumber(normalizedCorporateNumber);
        if (activeDuplicateCount > 0) {
            throw new IllegalStateException("이미 등록된 활성 업체의 사업자번호입니다");
        }

        String datePrefix = TENANT_CODE_DATE_FORMATTER.format(LocalDate.now(BUSINESS_ZONE));
        String maxCodeForDate = tenantInfoDAO.selectMaxTenantCodeByDatePrefix(datePrefix);

        String tenantSerialCode = TenantCodeGenerator.nextTenantCode(datePrefix, maxCodeForDate);
        String tenantCode = "TENANT_" + tenantSerialCode;

        tenantInfoDAO.insertTenant(
                tenantSerialCode,
                tenantNm,
                adminEmail,
                corporateNumber,
                businessType,
                businessCategory
        );

        TenantRegistrationResultVO resultVO = new TenantRegistrationResultVO();
        resultVO.setTenantId(tenantInfoDAO.selectTenantIdByCode(tenantSerialCode));
        resultVO.setTenantCode(tenantCode);
        resultVO.setTenantNm(tenantNm);
        resultVO.setAdminEmail(adminEmail);
        resultVO.setCorporateNumber(corporateNumber);
        resultVO.setBusinessType(businessType);
        resultVO.setBusinessCategory(businessCategory);
        resultVO.setCreatedAt(Instant.now().toString());
        return resultVO;
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
        if (requestVO.getCorporateNumber() == null || requestVO.getCorporateNumber().trim().isEmpty()) {
            throw new IllegalArgumentException("corporateNumber is required");
        }
        if (requestVO.getBusinessType() == null || requestVO.getBusinessType().trim().isEmpty()) {
            throw new IllegalArgumentException("businessType is required");
        }
        if (requestVO.getBusinessCategory() == null || requestVO.getBusinessCategory().trim().isEmpty()) {
            throw new IllegalArgumentException("businessCategory is required");
        }
        String adminEmail = requestVO.getAdminEmail();
        if (adminEmail == null || adminEmail.trim().isEmpty()) {
            throw new IllegalArgumentException("adminEmail is required");
        }
        if (!EMAIL_PATTERN.matcher(adminEmail.trim()).matches()) {
            throw new IllegalArgumentException("adminEmail format is invalid");
        }
    }

    private String normalizeCorporateNumber(String corporateNumber) {
        if (corporateNumber == null) {
            throw new IllegalArgumentException("corporateNumber is required");
        }

        String normalized = corporateNumber.replaceAll("[^0-9]", "");
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("corporateNumber format is invalid");
        }
        return normalized;
    }

    private String emptyToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
