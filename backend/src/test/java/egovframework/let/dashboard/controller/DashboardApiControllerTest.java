package egovframework.let.dashboard.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Collections;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import egovframework.com.cmm.LoginVO;
import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.let.dashboard.domain.model.DashboardTodoVO;
import egovframework.let.dashboard.service.DashboardService;

class DashboardApiControllerTest {

    private MockMvc mockMvc;
    private DashboardService dashboardService;
    private ResultVoHelper resultVoHelper;

    @BeforeEach
    void setUp() {
        dashboardService = mock(DashboardService.class);
        resultVoHelper = mock(ResultVoHelper.class);
        DashboardApiController controller = new DashboardApiController(resultVoHelper, dashboardService);

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
    void listMyTodos_returnsResultVoWrappedList() throws Exception {
        LoginVO loginVO = new LoginVO();
        loginVO.setId("socra710");
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(loginVO, null, java.util.Collections.emptyList())
        );

        DashboardTodoVO item = new DashboardTodoVO();
        item.setDraftingWorkCategoryId(100L);
        item.setDivisionName("일일업무보고(생산)");
        item.setTodoStatus("IN_PROGRESS");

        when(dashboardService.listMyTodos(eq("TENANT-A"), eq("socra710")))
            .thenReturn(Collections.singletonList(item));

        mockMvc.perform(get("/api/v1/dashboard/todos")
                .header("x-tenant-code", "TENANT-A"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resultCode").value(200))
            .andExpect(jsonPath("$.result.resultList[0].draftingWorkCategoryId").value(100))
            .andExpect(jsonPath("$.result.resultList[0].todoStatus").value("IN_PROGRESS"));

        SecurityContextHolder.clearContext();
    }

    @Test
    void listMyTodoCycles_includesDisplayStartDate() throws Exception {
        LoginVO loginVO = new LoginVO();
        loginVO.setId("socra710");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(loginVO, null, java.util.Collections.emptyList())
        );

        when(dashboardService.listMyTodoCycles(eq("TENANT-A"), eq("socra710"), eq("20261001"), eq("20261031")))
                .thenReturn(Collections.emptyList());
        when(dashboardService.getCalendarDisplayStartDate(eq("TENANT-A"), eq("socra710")))
                .thenReturn("20260610");

        mockMvc.perform(get("/api/v1/dashboard/todo-cycles")
                        .header("x-tenant-code", "TENANT-A")
                        .param("fromDate", "20261001")
                        .param("toDate", "20261031"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.displayStartDate").value("20260610"));

        SecurityContextHolder.clearContext();
    }
}
