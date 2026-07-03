package egovframework.let.platform_admin.loginhistory.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Collections;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.let.platform_admin.loginhistory.domain.model.LoginHistoryVO;
import egovframework.let.platform_admin.loginhistory.service.LoginHistoryService;

class LoginHistoryApiControllerTest {

    private MockMvc mockMvc;
    private LoginHistoryService loginHistoryService;
    private ResultVoHelper resultVoHelper;

    @BeforeEach
    void setUp() throws Exception {
        LoginHistoryApiController controller = new LoginHistoryApiController();
        loginHistoryService = mock(LoginHistoryService.class);
        resultVoHelper = mock(ResultVoHelper.class);

        ReflectionTestUtils.setField(controller, "loginHistoryService", loginHistoryService);
        ReflectionTestUtils.setField(controller, "resultVoHelper", resultVoHelper);

        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        when(loginHistoryService.selectLoginHistoryList(any(LoginHistoryVO.class))).thenReturn(Collections.emptyList());
        when(loginHistoryService.selectLoginHistoryListTotCnt(any(LoginHistoryVO.class))).thenReturn(0);
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
    void selectLoginHistoryList_usesV1Path_andResultVoEnvelope() throws Exception {
        mockMvc.perform(get("/api/v1/platform-admin/login-history"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resultCode").value(200))
            .andExpect(jsonPath("$.result.data.loginHistoryList").isArray())
            .andExpect(jsonPath("$.result.data.totalCount").value(0));
    }
}
