package egovframework.let.platforms.menus.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Collections;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import egovframework.com.cmm.service.ResultVO;
import egovframework.let.platforms.menus.service.PlatformMenuService;
import egovframework.let.uss.auth.service.MenuInfoVO;

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

            @Test
            void createMenu_allowsRootMenuWithoutUrl() throws Exception {
            MenuInfoVO created = new MenuInfoVO();
            created.setMenuId(501L);
            created.setMenuNm("루트 메뉴");
            created.setMenuUrl("");
            when(platformMenuService.createMenu(any(MenuInfoVO.class))).thenReturn(created);

            mockMvc.perform(post("/api/platform-admin/menus")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                    "\"menuNm\":\"루트 메뉴\"," +
                    "\"menuDc\":\"그룹\"," +
                    "\"menuUrl\":\"\"," +
                    "\"parentMenuId\":null," +
                    "\"menuOrdr\":1," +
                    "\"iconNm\":\"Settings\"," +
                    "\"useAt\":\"Y\"}"))
                .andExpect(status().isOk());
            }

            @Test
            void updateMenu_allowsRootMenuWithoutUrl() throws Exception {
            MenuInfoVO current = new MenuInfoVO();
            current.setMenuId(501L);
            current.setMenuCode("MENU_ROOT_GROUP");

            MenuInfoVO updated = new MenuInfoVO();
            updated.setMenuId(501L);
            updated.setMenuNm("루트 메뉴");
            updated.setMenuUrl("");

            when(platformMenuService.getMenuDetail(501L)).thenReturn(current);
            when(platformMenuService.updateMenu(any(Long.class), any(MenuInfoVO.class))).thenReturn(updated);

            mockMvc.perform(patch("/api/platform-admin/menus/501")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                    "\"menuNm\":\"루트 메뉴\"," +
                    "\"menuDc\":\"그룹\"," +
                    "\"menuUrl\":\"\"," +
                    "\"parentMenuId\":null," +
                    "\"menuOrdr\":1," +
                    "\"iconNm\":\"Settings\"," +
                    "\"useAt\":\"Y\"}"))
                .andExpect(status().isOk());
            }
}
