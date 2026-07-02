package egovframework.let.organization.authorities.controller;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.ArrayList;
import java.util.Collections;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import egovframework.com.cmm.LoginVO;
import egovframework.let.organization.authorities.service.AuthorityService;

class AuthorityApiControllerUserMenusTest {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void listCurrentUserMenus_usesLoginIdAndTenantId() throws Exception {
        AuthorityApiController controller = new AuthorityApiController();
        AuthorityService authorityService = mock(AuthorityService.class);
        ReflectionTestUtils.setField(controller, "authorityService", authorityService);

        doReturn(Collections.emptyList())
                .when(authorityService)
            .listUserMenus(eq("tenant.admin"), eq(10L));

        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        LoginVO loginVO = new LoginVO();
        loginVO.setId("tenant.admin");
        loginVO.setTenantId(10L);

        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(loginVO, null, new ArrayList<>())
        );

        mockMvc.perform(get("/api/platform-admin/user-menus/me"))
            .andExpect(status().isOk());

        verify(authorityService).listUserMenus("tenant.admin", 10L);
    }

    @Test
    void listCurrentUserMenus_returnsUnauthorizedWhenLoginIdMissing() throws Exception {
        AuthorityApiController controller = new AuthorityApiController();
        AuthorityService authorityService = mock(AuthorityService.class);
        ReflectionTestUtils.setField(controller, "authorityService", authorityService);

        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        LoginVO loginVO = new LoginVO();
        loginVO.setTenantId(20L);

        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(loginVO, null, new ArrayList<>())
        );

        mockMvc.perform(get("/api/platform-admin/user-menus/me"))
            .andExpect(status().isUnauthorized());
    }
}
