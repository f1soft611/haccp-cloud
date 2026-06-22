package egovframework.let.platforms.factories.web;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.let.platforms.factories.service.FactoryRegistrationRequestVO;
import egovframework.let.platforms.factories.service.FactoryRegistrationResultVO;
import egovframework.let.platforms.factories.service.PlatformFactoryService;
import egovframework.let.platforms.factories.service.PlatformTenantDashboardQueryVO;
import egovframework.let.platforms.factories.service.PlatformTenantDashboardResultVO;
import egovframework.let.platforms.factories.service.SampleTenantVO;
import egovframework.let.platforms.factories.service.TenantIssueCodeRequestVO;
import egovframework.let.platforms.factories.service.TenantIssueCodeResponseVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
@Tag(name = "PlatformFactoryApiController", description = "플랫폼 업체 관리")
public class PlatformFactoryApiController {

    @Resource(name = "platformFactoryService")
    private PlatformFactoryService platformFactoryService;

    @Resource(name = "resultVoHelper")
    private ResultVoHelper resultVoHelper;

    @Operation(
            summary = "업체 등록 및 코드 부여",
            description = "TB_FactoryInfo에 업체를 등록하고 6자리 FACTORY_CODE를 발급한다.",
            security = {@SecurityRequirement(name = "Authorization")}
    )
    @PostMapping({"/admin/factories", "/platform-admin/factories"})
    public ResultVO registerFactory(@RequestBody FactoryRegistrationRequestVO requestVO) {
        FactoryRegistrationResultVO resultVO = platformFactoryService.registerFactory(requestVO);

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("factory", resultVO);
        resultMap.put("resultMsg", "success.common.insert");

        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @PostMapping("/tenants/issue-code")
    public TenantIssueCodeResponseVO issueTenantCode(@RequestBody TenantIssueCodeRequestVO requestVO) {
        FactoryRegistrationRequestVO serviceRequest = new FactoryRegistrationRequestVO();
        serviceRequest.setFactoryNm(requestVO.getCompanyName());
        serviceRequest.setAdminEmail(requestVO.getAdminEmail());
        serviceRequest.setCorporateNumber(firstNonBlank(
                requestVO.getCorporateNumber(),
                requestVO.getBusinessRegistrationNumber()
        ));
        serviceRequest.setBusinessType(requestVO.getBusinessType());
        serviceRequest.setBusinessCategory(requestVO.getBusinessCategory());

        FactoryRegistrationResultVO created = platformFactoryService.registerFactory(serviceRequest);

        TenantIssueCodeResponseVO response = new TenantIssueCodeResponseVO();
        response.setTenantCode(created.getTenantCode());
        response.setCompanyName(created.getFactoryNm());
        response.setBusinessRegistrationNumber(trimToEmpty(requestVO.getBusinessRegistrationNumber()));
        response.setCorporateNumber(created.getCorporateNumber());
        response.setAdminEmail(created.getAdminEmail());
        response.setCreatedAt(created.getCreatedAt());
        response.setMailDispatchStatus("MOCK_SENT");
        return response;
    }

    @GetMapping("/tenants/samples")
    public List<SampleTenantVO> listSampleTenants() {
        return platformFactoryService.listRecentTenants(5);
    }

    @GetMapping("/platform-admin/dashboard/tenants")
    public PlatformTenantDashboardResultVO listDashboardTenants(
            @RequestParam(defaultValue = "0") int pageIndex,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String searchField,
            @RequestParam(required = false) String searchKeyword,
            @RequestParam(required = false, defaultValue = "all") String status) {
        PlatformTenantDashboardQueryVO queryVO = new PlatformTenantDashboardQueryVO();
        queryVO.setPageIndex(pageIndex);
        queryVO.setPageSize(pageSize);
        queryVO.setSearchField(searchField);
        queryVO.setSearchKeyword(searchKeyword);
        queryVO.setStatus(status);
        return platformFactoryService.listDashboardTenants(queryVO);
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
