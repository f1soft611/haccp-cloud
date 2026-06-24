package egovframework.let.platforms.tenants.controller;

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
import java.util.HashMap;
import java.util.Map;
import egovframework.let.platforms.tenants.domain.model.SampleTenantVO;
import egovframework.let.platforms.tenants.domain.model.TenantIssueCodeRequestVO;
import egovframework.let.platforms.tenants.domain.model.TenantIssueCodeResponseVO;
import egovframework.let.platforms.tenants.domain.model.TenantRegistrationRequestVO;
import egovframework.let.platforms.tenants.domain.model.TenantRegistrationResultVO;
import egovframework.let.platforms.tenants.domain.model.TenantVO;
import egovframework.let.platforms.tenants.service.PlatformTenantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
@Tag(name = "PlatformTenantApiController", description = "플랫폼 테넌트 관리")
@Slf4j
public class PlatformTenantApiController {

    @Resource(name = "platformTenantService")
    private PlatformTenantService platformTenantService;

    @Resource(name = "resultVoHelper")
    private ResultVoHelper resultVoHelper;

    @Operation(
            summary = "테넌트 등록 및 코드 부여",
            description = "tb_tenant에 테넌트를 등록하고 테넌트 코드를 발급한다.",
            security = {@SecurityRequirement(name = "Authorization")}
    )
    @PostMapping({"/admin/tenants", "/platform-admin/tenants"})
    public ResultVO registerTenant(@RequestBody TenantRegistrationRequestVO requestVO) {
        TenantRegistrationResultVO resultVO = platformTenantService.registerTenant(requestVO);

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("tenant", resultVO);
        resultMap.put("resultMsg", "success.common.insert");

        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @PostMapping("/tenants/issue-code")
    public ResultVO issueTenantCode(@RequestBody TenantIssueCodeRequestVO requestVO) {
        try {
            TenantRegistrationRequestVO serviceRequest = new TenantRegistrationRequestVO();
            serviceRequest.setTenantNm(requestVO.getCompanyName());
            serviceRequest.setAdminEmail(requestVO.getAdminEmail());
            serviceRequest.setCorporateNumber(requestVO.getCorporateNumber());
            serviceRequest.setBusinessType(requestVO.getBusinessType());
            serviceRequest.setBusinessCategory(requestVO.getBusinessCategory());

            TenantRegistrationResultVO created = platformTenantService.registerTenant(serviceRequest);
            platformTenantService.updateOnboardingStatusByTenantCode(created.getTenantCode(), "EMAIL_SENT");

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
            resultMap.put("mailDispatchStatus", response.getMailDispatchStatus());
            resultMap.put("resultMsg", "success.common.insert");

            return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
        } catch (IllegalStateException ex) {
            Map<String, Object> errorMap = new HashMap<String, Object>();
            errorMap.put("errorCode", "DUPLICATE_CORPORATE_NUMBER");
            errorMap.put("errorMessage", ex.getMessage());
            errorMap.put("resultMsg", "error.tenant.duplicate");
            return resultVoHelper.buildFromMap(errorMap, ResponseCode.BUSINESS_ERROR);
        }
    }

    @PostMapping("/tenants/onboarding/email-verified")
    public Map<String, Object> markEmailVerified(@RequestBody Map<String, String> requestBody) {
        String tenantCode = requestBody == null ? null : requestBody.get("tenantCode");
        platformTenantService.updateOnboardingStatusByTenantCode(tenantCode, "EMAIL_VERIFIED");

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("tenantCode", tenantCode);
        result.put("onboardingStatus", "EMAIL_VERIFIED");
        result.put("updated", true);
        return result;
    }

    @PostMapping("/tenants/onboarding/mail-sent")
    public Map<String, Object> markMailSent(@RequestBody Map<String, String> requestBody) {
        String tenantCode = requestBody == null ? null : requestBody.get("tenantCode");
        platformTenantService.updateOnboardingStatusByTenantCode(tenantCode, "EMAIL_SENT");

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("tenantCode", tenantCode);
        result.put("onboardingStatus", "EMAIL_SENT");
        result.put("updated", true);
        return result;
    }

    @PostMapping("/first-login-setup/complete")
    public Map<String, Object> completeFirstLoginSetup(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantCode) {
        platformTenantService.updateOnboardingStatusByTenantCode(tenantCode, "FIRST_SETUP_COMPLETED");

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("tenantCode", tenantCode);
        result.put("completed", true);
        result.put("onboardingRequired", false);
        result.put("onboardingStatus", "COMPLETED");
        return result;
    }

    @GetMapping("/tenants/{domain}")
    @Operation(
            summary = "도메인으로 테넌트 정보 조회",
            description = "관리자 이메일의 도메인(예: f1soft.co.kr)으로 테넌트 정보를 조회한다. 로그인 페이지에서 로고 및 회사명을 표시하기 위해 사용된다."
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

    @GetMapping("/tenants/{domain}/logo")
    @Operation(
            summary = "테넌트 로고 이미지 조회",
            description = "도메인을 기반으로 테넌트의 로고 이미지(Base64)를 조회한다."
    )
    public Map<String, Object> getTenantLogo(@PathVariable String domain) {
        Map<String, Object> result = new HashMap<String, Object>();
        try {
            TenantVO tenant = platformTenantService.findByAdminEmailDomain(domain);
            
            result.put("domain", domain);
            result.put("tenantNm", tenant.getTenantNm());
            result.put("logoImage", tenant.getLogoImage());
            result.put("success", true);
            
            log.info("getTenantLogo: domain={}, logoPresent={}", domain, tenant.getLogoImage() != null && !tenant.getLogoImage().isEmpty());
        } catch (IllegalArgumentException ex) {
            log.warn("getTenantLogo: tenant not found for domain={}", domain);
            result.put("success", false);
            result.put("errorCode", "TENANT_NOT_FOUND");
            result.put("errorMessage", "테넌트를 찾을 수 없습니다.");
        } catch (Exception ex) {
            log.error("getTenantLogo: unexpected error for domain={}", domain, ex);
            result.put("success", false);
            result.put("errorCode", "INTERNAL_ERROR");
            result.put("errorMessage", "서버 오류가 발생했습니다.");
        }
        return result;
    }

    @GetMapping("/tenants/samples")
    public List<SampleTenantVO> listSampleTenants() {
        return platformTenantService.listRecentTenants(5);
    }

    private String trimToEmpty(String value) {
        if (value == null) {
            return "";
        }
        return value.trim();
    }
}
