package egovframework.let.platforms.access.web;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;

import egovframework.com.cmm.LoginVO;
import egovframework.let.platforms.access.service.PlanAccessService;
import egovframework.let.uss.auth.service.EgovAuthManageService;

class PlanAccessInterceptorTest {

    private MockMvc mockMvc;
    private PlanAccessService planAccessService;
    private EgovAuthManageService authManageService;

    @BeforeEach
    void setUp() {
        planAccessService = mock(PlanAccessService.class);
        authManageService = mock(EgovAuthManageService.class);

        when(planAccessService.resolveTenantIdByTenantCode(eq("TENANT-A"))).thenReturn(1L);
        when(planAccessService.isWithinLimit(anyLong(), eq("LIMIT_USER_COUNT"))).thenReturn(true);

        PlanAccessInterceptor interceptor = new PlanAccessInterceptor(
                planAccessService,
                authManageService,
                new ObjectMapper()
        );

        mockMvc = MockMvcBuilders
                .standaloneSetup(new TestController())
                .addInterceptors(interceptor)
                .build();

        setAuthenticatedUser("TENANT_ADMIN", 1L, "TENANT-A");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void preHandle_returnsForbidden_whenPlanDenied() throws Exception {
        when(planAccessService.isFeatureEnabled(1L, "FEATURE_AUDIT_LOG")).thenReturn(false);

        mockMvc.perform(get("/api/platform-admin/login-history"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("PLAN_NOT_ALLOWED"));
    }

    @Test
    void preHandle_returnsForbidden_whenRoleDenied() throws Exception {
        when(planAccessService.isFeatureEnabled(1L, "FEATURE_AUDIT_LOG")).thenReturn(true);
        when(authManageService.checkUserMenuPermission("TENANT_ADMIN", "/platform/login-history"))
                .thenReturn("none");

        mockMvc.perform(get("/api/platform-admin/login-history"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ROLE_NOT_ALLOWED"));
    }

    @Test
    void preHandle_returnsOk_whenPlanAndRoleAllowed() throws Exception {
        when(planAccessService.isFeatureEnabled(1L, "FEATURE_AUDIT_LOG")).thenReturn(true);
        when(authManageService.checkUserMenuPermission("TENANT_ADMIN", "/platform/login-history"))
                .thenReturn("read");

        mockMvc.perform(get("/api/platform-admin/login-history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value("ok"));
    }

    @Test
    void preHandle_returnsForbidden_whenQuotaExceeded() throws Exception {
        when(planAccessService.isFeatureEnabled(1L, "FEATURE_TENANT_USER_MGMT")).thenReturn(true);
        when(authManageService.checkUserMenuPermission("TENANT_ADMIN", "/members"))
                .thenReturn("write");
        when(planAccessService.isWithinLimit(1L, "LIMIT_USER_COUNT")).thenReturn(false);

        mockMvc.perform(post("/members/insert")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("QUOTA_EXCEEDED"));
    }

    private void setAuthenticatedUser(String roleCode, Long tenantId, String tenantCode) {
        LoginVO loginVO = new LoginVO();
        loginVO.setRoleCode(roleCode);
        loginVO.setTenantId(tenantId);
        loginVO.setTenantCode(tenantCode);

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(loginVO, null, java.util.Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @RestController
    private static class TestController {
        @GetMapping("/api/platform-admin/login-history")
        public java.util.Map<String, String> loginHistory() {
            return java.util.Collections.singletonMap("result", "ok");
        }

        @PostMapping("/members/insert")
        public java.util.Map<String, String> insertMember() {
            return java.util.Collections.singletonMap("result", "ok");
        }
    }
}
