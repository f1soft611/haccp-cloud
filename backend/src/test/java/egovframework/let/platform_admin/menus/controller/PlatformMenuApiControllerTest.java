package egovframework.let.platform_admin.menus.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Arrays;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.let.platform_admin.menus.service.PlatformMenuService;
import egovframework.let.uss.auth.service.MenuInfoVO;

class PlatformMenuApiControllerTest {

    private MockMvc mockMvc;
    private PlatformMenuService platformMenuService;
    private ResultVoHelper resultVoHelper;

    @BeforeEach
    void setUp() {
        PlatformMenuApiController controller = new PlatformMenuApiController();
        platformMenuService = mock(PlatformMenuService.class);
        resultVoHelper = mock(ResultVoHelper.class);

        ReflectionTestUtils.setField(controller, "platformMenuService", platformMenuService);
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
    void listMenus_returnsResultVoEnvelope_onV1Path() throws Exception {
        MenuInfoVO menu = new MenuInfoVO();
        menu.setMenuId(1L);
        menu.setMenuNm("대시보드");
        when(platformMenuService.listMenus(null, null)).thenReturn(Arrays.asList(menu));

        mockMvc.perform(get("/api/v1/platform-admin/menus"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resultCode").value(200))
            .andExpect(jsonPath("$.result.items[0].menuId").value(1));
    }

    @Test
    void listCommonMenus_returnsResultVoEnvelope_onV1Path() throws Exception {
        MenuInfoVO menu = new MenuInfoVO();
        menu.setMenuId(2L);
        menu.setMenuNm("설정");
        when(platformMenuService.listMenus(null, null)).thenReturn(Arrays.asList(menu));

        mockMvc.perform(get("/api/v1/platform-admin/menus/common"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resultCode").value(200))
            .andExpect(jsonPath("$.result.items[0].menuId").value(2));
    }

    @Test
    void createMenu_returnsResultVoEnvelope() throws Exception {
        MenuInfoVO created = new MenuInfoVO();
        created.setMenuId(10L);
        created.setMenuNm("신규메뉴");
        when(platformMenuService.createMenu(any(MenuInfoVO.class))).thenReturn(created);

        mockMvc.perform(post("/api/v1/platform-admin/menus")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"menuNm\":\"신규메뉴\",\"menuUrl\":\"/new\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resultCode").value(200))
            .andExpect(jsonPath("$.result.menu.menuId").value(10));
    }

    @Test
    void replaceMenu_put_returnsResultVoEnvelope() throws Exception {
        MenuInfoVO updated = new MenuInfoVO();
        updated.setMenuId(11L);
        updated.setMenuNm("수정메뉴");
        when(platformMenuService.updateMenu(eq(11L), any(MenuInfoVO.class))).thenReturn(updated);

        mockMvc.perform(put("/api/v1/platform-admin/menus/11")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"menuNm\":\"수정메뉴\",\"menuUrl\":\"/updated\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resultCode").value(200))
            .andExpect(jsonPath("$.result.menu.menuId").value(11));

        verify(platformMenuService).updateMenu(eq(11L), any(MenuInfoVO.class));
    }

    @Test
    void patchMenu_patch_returnsResultVoEnvelope() throws Exception {
        MenuInfoVO patched = new MenuInfoVO();
        patched.setMenuId(12L);
        patched.setMenuNm("부분수정메뉴");
        when(platformMenuService.patchMenu(eq(12L), any(MenuInfoVO.class))).thenReturn(patched);

        mockMvc.perform(patch("/api/v1/platform-admin/menus/12")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"menuNm\":\"부분수정메뉴\",\"menuUrl\":\"/patched\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resultCode").value(200))
            .andExpect(jsonPath("$.result.menu.menuId").value(12));

        verify(platformMenuService).patchMenu(eq(12L), any(MenuInfoVO.class));
    }

    @Test
    void patchMenu_withPartialBody_doesNotRequireMenuNm() throws Exception {
        MenuInfoVO parent = new MenuInfoVO();
        parent.setMenuId(1L);
        parent.setMenuNm("상위메뉴");
        when(platformMenuService.getMenuDetail(1L)).thenReturn(parent);

        MenuInfoVO patched = new MenuInfoVO();
        patched.setMenuId(12L);
        patched.setMenuUrl("/patched-only");
        when(platformMenuService.patchMenu(eq(12L), any(MenuInfoVO.class))).thenReturn(patched);

        mockMvc.perform(patch("/api/v1/platform-admin/menus/12")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"parentMenuId\":1,\"menuUrl\":\"/patched-only\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resultCode").value(200))
            .andExpect(jsonPath("$.result.menu.menuUrl").value("/patched-only"));
    }

            @Test
            void patchMenu_rejectsMenuCodeChange() throws Exception {
            MenuInfoVO current = new MenuInfoVO();
            current.setMenuId(12L);
            current.setMenuCode("MENU_OLD");
            when(platformMenuService.getMenuDetail(12L)).thenReturn(current);

            mockMvc.perform(patch("/api/v1/platform-admin/menus/12")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"menuCode\":\"MENU_NEW\"}"))
                .andExpect(status().isBadRequest());
            }

    @Test
    void deleteMenu_returnsResultVoEnvelope() throws Exception {
        mockMvc.perform(delete("/api/v1/platform-admin/menus/33"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resultCode").value(200))
            .andExpect(jsonPath("$.result.menuId").value(33));

        verify(platformMenuService).deleteMenu(anyLong());
    }
}
