package egovframework.let.platforms.tenants.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
        serviceRequest.setCorporateNumber(firstNonBlank(
                requestVO.getCorporateNumber(),
                requestVO.getBusinessRegistrationNumber()
        ));
        serviceRequest.setBusinessType(requestVO.getBusinessType());
        serviceRequest.setBusinessCategory(requestVO.getBusinessCategory());

        TenantRegistrationResultVO created = platformTenantService.registerTenant(serviceRequest);

        TenantIssueCodeResponseVO response = new TenantIssueCodeResponseVO();
        response.setTenantCode(created.getTenantCode());
        response.setCompanyName(created.getTenantNm());
        response.setBusinessRegistrationNumber(trimToEmpty(requestVO.getBusinessRegistrationNumber()));
        response.setCorporateNumber(created.getCorporateNumber());
        response.setAdminEmail(created.getAdminEmail());
        response.setCreatedAt(created.getCreatedAt());
        response.setMailDispatchStatus("MOCK_SENT");
        return response;
    }

    @GetMapping("/tenants/samples")
    public List<SampleTenantVO> listSampleTenants() {
        return platformTenantService.listRecentTenants(5);
    }

    private String firstNonBlank(String first, String second) {
        if (first != null && !first.trim().isEmpty()) {
            return first.trim();
        }
        if (second != null && !second.trim().isEmpty()) {
            return second.trim();
        }
        return null;
    }

    private String trimToEmpty(String value) {
        if (value == null) {
            return "";
        }
        return value.trim();
    }
}
