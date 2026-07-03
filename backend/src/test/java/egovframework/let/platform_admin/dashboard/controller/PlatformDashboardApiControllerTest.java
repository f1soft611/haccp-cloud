package egovframework.let.platform_admin.dashboard.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.let.platform_admin.dashboard.domain.model.PlatformDashboardKpisVO;
import egovframework.let.platform_admin.dashboard.service.PlatformDashboardService;
import egovframework.let.platform_admin.tenants.domain.model.PlatformTenantDashboardSummaryVO;
import egovframework.let.platform_admin.tenants.domain.model.PlatformTenantDashboardResultVO;

class PlatformDashboardApiControllerTest {

    private MockMvc mockMvc;
    private PlatformDashboardService platformDashboardService;
    private ResultVoHelper resultVoHelper;

    @BeforeEach
    void setUp() {
        PlatformDashboardApiController controller = new PlatformDashboardApiController();
        platformDashboardService = mock(PlatformDashboardService.class);
        resultVoHelper = mock(ResultVoHelper.class);

        ReflectionTestUtils.setField(controller, "platformDashboardService", platformDashboardService);
        ReflectionTestUtils.setField(controller, "resultVoHelper", resultVoHelper);

        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        when(resultVoHelper.buildFromMap(anyMap(), any(ResponseCode.class))).thenAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            java.util.Map<String, Object> map = (java.util.Map<String, Object>) invocation.getArgument(0);
            ResponseCode responseCode = invocation.getArgument(1);
            ResultVO result = new ResultVO();
            result.setResult(map);
            result.setResultCode(responseCode.getCode());
            result.setResultMessage(responseCode.getMessage());
            return result;
        });
    }

    @Test
    void getKpis_usesV1Path_andResultVoEnvelope() throws Exception {
        when(platformDashboardService.getDashboardKpis()).thenReturn(new PlatformDashboardKpisVO());

        mockMvc.perform(get("/api/v1/platform-admin/dashboard/kpis"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resultCode").value(200))
            .andExpect(jsonPath("$.result.data").exists());
    }

    @Test
    void listDashboardTenants_usesV1Path_andResultVoEnvelope() throws Exception {
        PlatformTenantDashboardResultVO resultVO = new PlatformTenantDashboardResultVO();
        PlatformTenantDashboardSummaryVO summaryVO = new PlatformTenantDashboardSummaryVO();
        summaryVO.setTotal(0);
        resultVO.setSummary(summaryVO);
        when(platformDashboardService.listDashboardTenants(any())).thenReturn(resultVO);

        mockMvc.perform(get("/api/v1/platform-admin/dashboard/tenants"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resultCode").value(200))
            .andExpect(jsonPath("$.result.data.summary.total").value(0));
    }
}
