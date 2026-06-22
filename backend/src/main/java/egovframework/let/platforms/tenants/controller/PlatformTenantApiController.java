package egovframework.let.platforms.tenants.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.let.platforms.tenants.domain.model.SampleTenantVO;
import egovframework.let.platforms.tenants.domain.model.TenantIssueCodeRequestVO;
import egovframework.let.platforms.tenants.domain.model.TenantIssueCodeResponseVO;
import egovframework.let.platforms.tenants.domain.model.TenantRegistrationRequestVO;
import egovframework.let.platforms.tenants.domain.model.TenantRegistrationResultVO;
import egovframework.let.platforms.tenants.service.PlatformTenantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
@Tag(name = "PlatformTenantApiController", description = "플랫폼 테넌트 관리")
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
    public TenantIssueCodeResponseVO issueTenantCode(@RequestBody TenantIssueCodeRequestVO requestVO) {
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
        return response;
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
