package egovframework.let.platforms.menus.controller;

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

import egovframework.com.cmm.service.ResultVO;
import egovframework.let.platforms.menus.service.PlatformMenuService;

class PlatformMenuApiControllerPagingTest {

    private MockMvc mockMvc;
    private PlatformMenuService platformMenuService;

    @BeforeEach
    void setUp() {
        PlatformMenuApiController controller = new PlatformMenuApiController();
        platformMenuService = mock(PlatformMenuService.class);
        ReflectionTestUtils.setField(controller, "platformMenuService", platformMenuService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void listMenusPaged_rejectsInvalidPageSize() throws Exception {
        mockMvc.perform(get("/api/platform-admin/menus/paged")
                .param("pageIndex", "1")
                .param("pageSize", "15"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void listMenusPaged_returnsPagedResponse() throws Exception {
        ResultVO result = new ResultVO();
        java.util.Map<String, Object> payload = new java.util.HashMap<String, Object>();
        payload.put("totalCount", 23);
        payload.put("paginationInfo", java.util.Collections.singletonMap("currentPageNo", 2));
        result.setResult(payload);
        when(platformMenuService.listMenusPaged(2, 10, "menuNm", "관리", "Y")).thenReturn(result);

        mockMvc.perform(get("/api/platform-admin/menus/paged")
                .param("pageIndex", "2")
                .param("pageSize", "10")
                .param("searchField", "menuNm")
                .param("searchKeyword", "관리")
                .param("useAt", "Y"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.result.totalCount").value(23))
            .andExpect(jsonPath("$.result.paginationInfo.currentPageNo").value(2));
    }
}
