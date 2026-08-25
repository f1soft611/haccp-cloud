package egovframework.let.platform_admin.access.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Arrays;
import java.util.Collections;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.let.platform_admin.access.domain.model.PlanSummaryVO;
import egovframework.let.platform_admin.access.service.PlanAccessService;

class PlanAccessApiControllerTest {

    private MockMvc mockMvc;
    private PlanAccessService planAccessService;
    private ResultVoHelper resultVoHelper;

    @BeforeEach
    void setUp() {
        planAccessService = mock(PlanAccessService.class);
        resultVoHelper = mock(ResultVoHelper.class);

        PlanAccessApiController controller = new PlanAccessApiController(planAccessService);
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
    void listPlans_usesV1Path_andResultVoEnvelope() throws Exception {
        PlanSummaryVO planSummaryVO = new PlanSummaryVO();
        planSummaryVO.setPlanCode("A");
        when(planAccessService.listPlans()).thenReturn(Arrays.asList(planSummaryVO));

        mockMvc.perform(get("/api/v1/platform-admin/plan-access/plans"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resultCode").value(200))
            .andExpect(jsonPath("$.result.data[0].planCode").value("A"));
    }

    @Test
    void getPlanFeatures_usesV1Path_andResultVoEnvelope() throws Exception {
        when(planAccessService.resolvePlanFeatureItems(eq("A"))).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/platform-admin/plan-access/plans/a/features"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resultCode").value(200))
            .andExpect(jsonPath("$.result.data.planCode").value("A"));
    }
}
