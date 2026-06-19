package egovframework.let.uss.auth.web;

import static org.mockito.ArgumentMatchers.any;
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

import egovframework.let.uss.auth.service.EgovAuthManageService;
import egovframework.let.uss.auth.service.MenuInfoVO;

class PlatformMenuApiControllerPagingTest {

    private MockMvc mockMvc;
    private EgovAuthManageService authManageService;

    @BeforeEach
    void setUp() {
        PlatformMenuApiController controller = new PlatformMenuApiController();
        authManageService = mock(EgovAuthManageService.class);
        ReflectionTestUtils.setField(controller, "authManageService", authManageService);
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
        MenuInfoVO item = new MenuInfoVO();
        item.setMenuId("MENU_1");
        when(authManageService.selectMenuPagedList(any(MenuInfoVO.class))).thenReturn(Collections.singletonList(item));
        when(authManageService.selectMenuPagedCount(any(MenuInfoVO.class))).thenReturn(23);

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
