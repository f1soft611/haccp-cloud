package egovframework.let.platform_admin.tenants.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.let.platform_admin.access.web.PlanAccessLevel;
import egovframework.let.platform_admin.access.web.PlanAccessPolicy;
import egovframework.let.platform_admin.tenants.domain.model.PlatformTenantDashboardItemVO;
import egovframework.let.platform_admin.tenants.domain.model.SampleTenantVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantIssueCodeRequestVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantIssueCodeResponseVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantRegistrationRequestVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantRegistrationResultVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantVO;
import egovframework.let.platform_admin.tenants.service.PlatformTenantService;
import egovframework.let.platform_admin.tenants.service.TenantOnboardingService;
import egovframework.let.platform_admin.tenants.service.exception.MailAuthenticationFailureException;
import egovframework.let.platform_admin.tenants.service.exception.MailConfigurationException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 플랫폼 테넌트 API 컨트롤러
 * @author SHMT-MES
 * @since 2026.07.03
 * @version 1.0
 * @see
 *
 * <pre>
 * << 개정이력(Modification Information) >>
 *
 *   수정일      수정자           수정내용
 *  -------    --------    ---------------------------
 *   2026.07.03 SHMT-MES          최초 생성
 *
 * </pre>
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/platform-admin/tenants")
@Tag(name = "PlatformTenantApiController", description = "플랫폼 테넌트 관리")
@Slf4j
public class PlatformTenantApiController {

    @Resource(name = "platformTenantService")
    private PlatformTenantService platformTenantService;

    @Resource(name = "resultVoHelper")
    private ResultVoHelper resultVoHelper;

    @Resource(name = "tenantOnboardingService")
    private TenantOnboardingService tenantOnboardingService;

    @Operation(
            summary = "테넌트 등록 및 코드 부여",
            description = "tb_tenant에 테넌트를 등록하고 테넌트 코드를 발급한다.",
            security = {@SecurityRequirement(name = "Authorization")}
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "등록 성공"),
            @ApiResponse(responseCode = "403", description = "인가 실패")
    })
    @PlanAccessPolicy(
            menuUrl = "/platform/tenants",
            featureCode = "FEATURE_PLATFORM_TENANT_MGMT",
            requiredPermissionLevel = PlanAccessLevel.WRITE
    )
    @PostMapping
    public ResultVO registerTenant(@RequestBody TenantRegistrationRequestVO requestVO) {
        TenantRegistrationResultVO resultVO = platformTenantService.registerTenant(requestVO);

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("tenant", resultVO);
        resultMap.put("resultMsg", "success.common.insert");

        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

        @Operation(
            summary = "테넌트 코드 발급",
            description = "요청 기반으로 테넌트를 생성하고 인증 메일을 발송"
        )
    @PostMapping("/issue-code")
    public ResultVO issueTenantCode(@RequestBody TenantIssueCodeRequestVO requestVO) {
        try {
            TenantRegistrationRequestVO serviceRequest = new TenantRegistrationRequestVO();
            serviceRequest.setTenantNm(requestVO.getCompanyName());
            serviceRequest.setAdminEmail(requestVO.getAdminEmail());
            serviceRequest.setAdminName(requestVO.getAdminName());
            serviceRequest.setCorporateNumber(requestVO.getCorporateNumber());
            serviceRequest.setBusinessType(requestVO.getBusinessType());
            serviceRequest.setBusinessCategory(requestVO.getBusinessCategory());
            serviceRequest.setPlanCode(requestVO.getPlanCode());

            TenantRegistrationResultVO created = platformTenantService.registerTenant(serviceRequest);
            tenantOnboardingService.dispatchVerificationEmail(created.getTenantCode(), requestVO.getAdminName());

            TenantIssueCodeResponseVO response = new TenantIssueCodeResponseVO();
            response.setTenantCode(created.getTenantCode());
            response.setCompanyName(created.getTenantNm());
            response.setBusinessRegistrationNumber(trimToEmpty(requestVO.getBusinessRegistrationNumber()));
            response.setCorporateNumber(created.getCorporateNumber());
            response.setAdminEmail(created.getAdminEmail());
            response.setCreatedAt(created.getCreatedAt());
            response.setMailDispatchStatus("SENT");

            Map<String, Object> resultMap = new HashMap<String, Object>();
            resultMap.put("tenantCode", response.getTenantCode());
            resultMap.put("companyName", response.getCompanyName());
            resultMap.put("businessRegistrationNumber", response.getBusinessRegistrationNumber());
            resultMap.put("corporateNumber", response.getCorporateNumber());
            resultMap.put("adminEmail", response.getAdminEmail());
            resultMap.put("createdAt", response.getCreatedAt());
            resultMap.put("mailDispatchStatus", response.getMailDispatchStatus());
            resultMap.put("resultMsg", "success.common.insert");

            return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
        } catch (IllegalStateException ex) {
            Map<String, Object> errorMap = new HashMap<String, Object>();
            errorMap.put("errorCode", "TENANT_ISSUE_CONFLICT");
            errorMap.put("errorMessage", ex.getMessage());
            errorMap.put("resultMsg", "error.tenant.issue.conflict");
            return resultVoHelper.buildFromMap(errorMap, ResponseCode.BUSINESS_ERROR);
        } catch (MailConfigurationException ex) {
            Map<String, Object> errorMap = new HashMap<String, Object>();
            errorMap.put("errorCode", "MAIL_CONFIG_ERROR");
            errorMap.put("errorMessage", ex.getMessage());
            errorMap.put("resultMsg", "error.tenant.mail.config");
            return resultVoHelper.buildFromMap(errorMap, ResponseCode.BUSINESS_ERROR);
        } catch (MailAuthenticationFailureException ex) {
            Map<String, Object> errorMap = new HashMap<String, Object>();
            errorMap.put("errorCode", "MAIL_AUTH_ERROR");
            errorMap.put("errorMessage", ex.getMessage());
            errorMap.put("resultMsg", "error.tenant.mail.auth");
            return resultVoHelper.buildFromMap(errorMap, ResponseCode.BUSINESS_ERROR);
        } catch (RuntimeException ex) {
            Map<String, Object> errorMap = new HashMap<String, Object>();
            errorMap.put("errorCode", "TENANT_ISSUE_FAILED");
            errorMap.put("errorMessage", ex.getMessage());
            errorMap.put("resultMsg", "error.tenant.issue");
            return resultVoHelper.buildFromMap(errorMap, ResponseCode.INTERNAL_SERVER_ERROR);
        }
    }

        @Operation(
            summary = "온보딩 상태 EMAIL_VERIFIED 변경",
            description = "테넌트 온보딩 상태를 EMAIL_VERIFIED로 변경"
        )
    @PostMapping("/onboarding/email-verified")
    @PlanAccessPolicy(
            menuUrl = "/platform/tenants",
            featureCode = "FEATURE_PLATFORM_TENANT_MGMT",
            requiredPermissionLevel = PlanAccessLevel.WRITE
    )
    public ResultVO markEmailVerified(@RequestBody Map<String, String> requestBody) {
        String tenantCode = requestBody == null ? null : requestBody.get("tenantCode");
        if (!hasText(tenantCode)) {
            Map<String, Object> error = new HashMap<String, Object>();
            error.put("errorCode", "INVALID_TENANT_CODE");
            error.put("errorMessage", "tenantCode는 필수입니다.");
            return resultVoHelper.buildFromMap(error, ResponseCode.BUSINESS_ERROR);
        }
        tenantCode = tenantCode.trim();
        platformTenantService.updateOnboardingStatusByTenantCode(tenantCode, "EMAIL_VERIFIED");

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("tenantCode", tenantCode);
        result.put("onboardingStatus", "EMAIL_VERIFIED");
        result.put("updated", true);
        return resultVoHelper.buildFromMap(result, ResponseCode.SUCCESS);
    }

        @Operation(
            summary = "온보딩 상태 EMAIL_SENT 변경",
            description = "테넌트 온보딩 상태를 EMAIL_SENT로 변경"
        )
    @PostMapping("/onboarding/mail-sent")
    @PlanAccessPolicy(
            menuUrl = "/platform/tenants",
            featureCode = "FEATURE_PLATFORM_TENANT_MGMT",
            requiredPermissionLevel = PlanAccessLevel.WRITE
    )
    public ResultVO markMailSent(@RequestBody Map<String, String> requestBody) {
        String tenantCode = requestBody == null ? null : requestBody.get("tenantCode");
        if (!hasText(tenantCode)) {
            Map<String, Object> error = new HashMap<String, Object>();
            error.put("errorCode", "INVALID_TENANT_CODE");
            error.put("errorMessage", "tenantCode는 필수입니다.");
            return resultVoHelper.buildFromMap(error, ResponseCode.BUSINESS_ERROR);
        }
        tenantCode = tenantCode.trim();
        platformTenantService.updateOnboardingStatusByTenantCode(tenantCode, "EMAIL_SENT");

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("tenantCode", tenantCode);
        result.put("onboardingStatus", "EMAIL_SENT");
        result.put("updated", true);
        return resultVoHelper.buildFromMap(result, ResponseCode.SUCCESS);
    }

        @Operation(
            summary = "첫 로그인 설정 완료",
            description = "첫 로그인 설정 완료 처리"
        )
    @PostMapping("/first-login-setup/complete")
    @PlanAccessPolicy(
            menuUrl = "/platform/tenants",
            featureCode = "FEATURE_PLATFORM_TENANT_MGMT",
            requiredPermissionLevel = PlanAccessLevel.WRITE
    )
    public ResultVO completeFirstLoginSetup(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantCode) {
        if (!hasText(tenantCode)) {
            Map<String, Object> error = new HashMap<String, Object>();
            error.put("errorCode", "INVALID_TENANT_CODE");
            error.put("errorMessage", "x-tenant-code 헤더는 필수입니다.");
            return resultVoHelper.buildFromMap(error, ResponseCode.BUSINESS_ERROR);
        }
        tenantCode = tenantCode.trim();
        platformTenantService.updateOnboardingStatusByTenantCode(tenantCode, "FIRST_SETUP_COMPLETED");

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("tenantCode", tenantCode);
        result.put("completed", true);
        result.put("onboardingRequired", false);
        result.put("onboardingStatus", "FIRST_SETUP_COMPLETED");
        return resultVoHelper.buildFromMap(result, ResponseCode.SUCCESS);
    }

    @GetMapping("/domains/{domain}")
    @Operation(
            summary = "도메인으로 테넌트 정보 조회",
            description = "테넌트 도메인 매핑(예: f1soft.co.kr)으로 테넌트 정보를 조회한다. 로그인 페이지에서 로고 및 회사명을 표시하기 위해 사용된다."
    )
    public ResultVO getTenantByDomain(@PathVariable String domain) {
        try {
            TenantVO tenant = platformTenantService.findByAdminEmailDomain(domain);
            
            Map<String, Object> resultMap = new HashMap<String, Object>();
            resultMap.put("tenantId", tenant.getTenantId());
            resultMap.put("tenantNm", tenant.getTenantNm());
            resultMap.put("logoImage", tenant.getLogoImage());
            resultMap.put("onboardingStatus", tenant.getOnboardingStatus());
            resultMap.put("useAt", tenant.getUseAt());
            
            log.info("getTenantByDomain: domain={}, tenantId={}", domain, tenant.getTenantId());
            return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
        } catch (IllegalArgumentException ex) {
            log.warn("getTenantByDomain: tenant not found for domain={}", domain);
            Map<String, Object> errorMap = new HashMap<String, Object>();
            errorMap.put("errorCode", "TENANT_NOT_FOUND");
            errorMap.put("errorMessage", "테넌트를 찾을 수 없습니다.");
            return resultVoHelper.buildFromMap(errorMap, ResponseCode.BUSINESS_ERROR);
        } catch (Exception ex) {
            log.error("getTenantByDomain: unexpected error for domain={}", domain, ex);
            Map<String, Object> errorMap = new HashMap<String, Object>();
            errorMap.put("errorCode", "INTERNAL_ERROR");
            errorMap.put("errorMessage", "서버 오류가 발생했습니다.");
            return resultVoHelper.buildFromMap(errorMap, ResponseCode.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/domains/{domain}/logo")
    @Operation(
            summary = "테넌트 로고 이미지 조회",
            description = "도메인을 기반으로 테넌트의 로고 이미지(Base64)를 조회한다."
    )
    public ResultVO getTenantLogo(@PathVariable String domain) {
        Map<String, Object> result = new HashMap<String, Object>();
        try {
            TenantVO tenant = platformTenantService.findByAdminEmailDomain(domain);
            
            result.put("domain", domain);
            result.put("tenantNm", tenant.getTenantNm());
            result.put("logoImage", tenant.getLogoImage());
            result.put("success", true);
            
            log.info("getTenantLogo: domain={}, logoPresent={}", domain, tenant.getLogoImage() != null && !tenant.getLogoImage().isEmpty());
            return resultVoHelper.buildFromMap(result, ResponseCode.SUCCESS);
        } catch (IllegalArgumentException ex) {
            log.warn("getTenantLogo: tenant not found for domain={}", domain);
            result.put("success", false);
            result.put("errorCode", "TENANT_NOT_FOUND");
            result.put("errorMessage", "테넌트를 찾을 수 없습니다.");
            return resultVoHelper.buildFromMap(result, ResponseCode.BUSINESS_ERROR);
        } catch (Exception ex) {
            log.error("getTenantLogo: unexpected error for domain={}", domain, ex);
            result.put("success", false);
            result.put("errorCode", "INTERNAL_ERROR");
            result.put("errorMessage", "서버 오류가 발생했습니다.");
            return resultVoHelper.buildFromMap(result, ResponseCode.INTERNAL_SERVER_ERROR);
        }
    }

        @Operation(
            summary = "샘플 테넌트 목록 조회",
            description = "최근 샘플 테넌트 목록을 조회"
        )
    @GetMapping("/samples")
    public ResultVO listSampleTenants() {
        List<SampleTenantVO> items = platformTenantService.listRecentTenants(5);

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("items", items);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

        @Operation(
            summary = "테넌트 상세 조회",
            description = "테넌트 코드 기준 상세 정보를 조회",
            security = {@SecurityRequirement(name = "Authorization")}
        )
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "인가 실패")
        })
    @PlanAccessPolicy(
            menuUrl = "/platform/tenants",
            featureCode = "FEATURE_PLATFORM_TENANT_MGMT",
            requiredPermissionLevel = PlanAccessLevel.READ
    )
    @GetMapping("/{tenantCode}")
    public ResultVO getTenantDetail(@PathVariable String tenantCode) {
        PlatformTenantDashboardItemVO item = platformTenantService.findDashboardTenantByCode(tenantCode);
        if (item == null) {
            Map<String, Object> errorMap = new HashMap<String, Object>();
            errorMap.put("errorCode", "TENANT_NOT_FOUND");
            errorMap.put("errorMessage", "업체 정보를 찾을 수 없습니다.");
            return resultVoHelper.buildFromMap(errorMap, ResponseCode.BUSINESS_ERROR);
        }

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("tenant", item);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    private String trimToEmpty(String value) {
        if (value == null) {
            return "";
        }
        return value.trim();
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
