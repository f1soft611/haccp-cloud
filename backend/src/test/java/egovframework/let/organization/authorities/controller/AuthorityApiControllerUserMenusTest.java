package egovframework.let.organization.authorities.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.ArrayList;
import java.util.Collections;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import egovframework.com.cmm.LoginVO;
import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.let.organization.authorities.service.AuthorityService;

class AuthorityApiControllerUserMenusTest {

    private ResultVoHelper resultVoHelper;

    @BeforeEach
    void setUp() {
        resultVoHelper = mock(ResultVoHelper.class);
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

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void listCurrentUserMenus_usesLoginIdAndTenantId() throws Exception {
        AuthorityApiController controller = new AuthorityApiController();
        AuthorityService authorityService = mock(AuthorityService.class);
        ReflectionTestUtils.setField(controller, "authorityService", authorityService);
        ReflectionTestUtils.setField(controller, "resultVoHelper", resultVoHelper);

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

        mockMvc.perform(get("/api/v1/platform-admin/user-menus/me"))
            .andExpect(status().isOk());

        verify(authorityService).listUserMenus("tenant.admin", 10L);
    }

    @Test
    void listCurrentUserMenus_returnsUnauthorizedWhenLoginIdMissing() throws Exception {
        AuthorityApiController controller = new AuthorityApiController();
        AuthorityService authorityService = mock(AuthorityService.class);
        ReflectionTestUtils.setField(controller, "authorityService", authorityService);
        ReflectionTestUtils.setField(controller, "resultVoHelper", resultVoHelper);

        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        LoginVO loginVO = new LoginVO();
        loginVO.setTenantId(20L);

        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(loginVO, null, new ArrayList<>())
        );

        mockMvc.perform(get("/api/v1/platform-admin/user-menus/me"))
            .andExpect(status().isUnauthorized());
    }
}
