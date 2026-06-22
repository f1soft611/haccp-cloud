package egovframework.let.platforms.authorities.controller;

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

import egovframework.com.cmm.service.ResultVO;
import egovframework.let.platforms.authorities.service.PlatformAuthorityService;

class PlatformAuthorityApiControllerPagingTest {

    private MockMvc mockMvc;
    private PlatformAuthorityService platformAuthorityService;

    @BeforeEach
    void setUp() {
        PlatformAuthorityApiController controller = new PlatformAuthorityApiController();
        platformAuthorityService = mock(PlatformAuthorityService.class);
        ReflectionTestUtils.setField(controller, "platformAuthorityService", platformAuthorityService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void listRolesPaged_rejectsPageIndexLessThanOne() throws Exception {
        mockMvc.perform(get("/api/platform-admin/roles/paged")
                .param("pageIndex", "0")
                .param("pageSize", "10"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void listRolesPaged_returnsPagedResponse() throws Exception {
        ResultVO result = new ResultVO();
        java.util.Map<String, Object> payload = new java.util.HashMap<String, Object>();
        payload.put("totalCount", 7);
        payload.put("paginationInfo", java.util.Collections.singletonMap("currentPageNo", 1));
        result.setResult(payload);
        when(platformAuthorityService.listRolesPaged(1, 20, "name", "관리자", "all")).thenReturn(result);

        mockMvc.perform(get("/api/platform-admin/roles/paged")
                .param("pageIndex", "1")
                .param("pageSize", "20")
                .param("searchField", "name")
                .param("searchKeyword", "관리자"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.result.totalCount").value(7))
            .andExpect(jsonPath("$.result.paginationInfo.currentPageNo").value(1));
    }
}
