package egovframework.let.platform_admin.tenants.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Arrays;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.let.platform_admin.tenants.controller.PlatformTenantApiController;
import egovframework.let.platform_admin.tenants.domain.model.PlatformTenantDashboardItemVO;
import egovframework.let.platform_admin.tenants.domain.model.SampleTenantVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantRegistrationResultVO;
import egovframework.let.platform_admin.tenants.service.PlatformTenantService;
import egovframework.let.platform_admin.tenants.service.TenantOnboardingService;

class PlatformTenantApiControllerTest {

    private MockMvc mockMvc;
    private PlatformTenantService platformTenantService;
    private TenantOnboardingService tenantOnboardingService;
    private ResultVoHelper resultVoHelper;

    @BeforeEach
    void setUp() {
        PlatformTenantApiController controller = new PlatformTenantApiController();
        platformTenantService = mock(PlatformTenantService.class);
        tenantOnboardingService = mock(TenantOnboardingService.class);
        resultVoHelper = mock(ResultVoHelper.class);

        ReflectionTestUtils.setField(controller, "platformTenantService", platformTenantService);
        ReflectionTestUtils.setField(controller, "tenantOnboardingService", tenantOnboardingService);
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
    void issueTenantCode_returnsExpectedPayload() throws Exception {
        TenantRegistrationResultVO created = new TenantRegistrationResultVO();
        created.setTenantCode("TENANT_000001");
        created.setTenantNm("테스트업체");
        created.setAdminEmail("admin@test.com");
        created.setAdminName("홍길동");
        created.setCorporateNumber("CORP-001");
        created.setCreatedAt("2026-06-22T10:00:00Z");

        when(platformTenantService.registerTenant(any())).thenReturn(created);

        mockMvc.perform(post("/api/v1/platform-admin/tenants/issue-code")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"companyName\":\"테스트업체\",\"businessRegistrationNumber\":\"123-45-67890\",\"corporateNumber\":\"CORP-001\",\"businessType\":\"식품제조\",\"businessCategory\":\"즉석조리식품\",\"adminEmail\":\"admin@test.com\",\"adminName\":\"홍길동\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.result.tenantCode").value("TENANT_000001"))
            .andExpect(jsonPath("$.result.companyName").value("테스트업체"))
            .andExpect(jsonPath("$.result.mailDispatchStatus").value("SENT"));

        verify(tenantOnboardingService).dispatchVerificationEmail("TENANT_000001", "홍길동");
    }

    @Test
    void listSampleTenants_returnsTenantList() throws Exception {
        SampleTenantVO first = new SampleTenantVO();
        first.setTenantCode("TENANT_000001");
        first.setCompanyName("테스트업체1");

        SampleTenantVO second = new SampleTenantVO();
        second.setTenantCode("TENANT_000002");
        second.setCompanyName("테스트업체2");

        when(platformTenantService.listRecentTenants(5)).thenReturn(Arrays.asList(first, second));

        mockMvc.perform(get("/api/v1/platform-admin/tenants/samples"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.result.items[0].tenantCode").value("TENANT_000001"))
            .andExpect(jsonPath("$.result.items[1].tenantCode").value("TENANT_000002"));
    }

    @Test
    void getTenantDetail_returnsTenantPayload() throws Exception {
        PlatformTenantDashboardItemVO detail = new PlatformTenantDashboardItemVO();
        detail.setTenantCode("TENANT_000001");
        detail.setCompanyName("테스트업체");
        detail.setAdminName("홍길동");
        detail.setAdminEmail("admin@test.com");
        detail.setStatus("ACTIVE");
        detail.setOnboardingStatus("EMAIL_SENT");

        when(platformTenantService.findDashboardTenantByCode("TENANT_000001")).thenReturn(detail);

        mockMvc.perform(get("/api/v1/platform-admin/tenants/TENANT_000001"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.result.tenant.tenantCode").value("TENANT_000001"))
            .andExpect(jsonPath("$.result.tenant.onboardingStatus").value("EMAIL_SENT"));
    }

    @Test
    void markEmailVerified_withoutTenantCode_returnsBusinessError() throws Exception {
        mockMvc.perform(post("/api/v1/platform-admin/tenants/onboarding/email-verified")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resultCode").value(600))
            .andExpect(jsonPath("$.result.errorCode").value("INVALID_TENANT_CODE"));
    }

    @Test
    void completeFirstLoginSetup_withoutHeader_returnsBusinessError() throws Exception {
        mockMvc.perform(post("/api/v1/platform-admin/tenants/first-login-setup/complete"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resultCode").value(600))
            .andExpect(jsonPath("$.result.errorCode").value("INVALID_TENANT_CODE"));
    }

    @Test
    void markMailSent_trimsTenantCodeBeforeServiceCall() throws Exception {
        mockMvc.perform(post("/api/v1/platform-admin/tenants/onboarding/mail-sent")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"tenantCode\":\"  TENANT_001  \"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resultCode").value(200));

        verify(platformTenantService).updateOnboardingStatusByTenantCode(eq("TENANT_001"), eq("EMAIL_SENT"));
        verify(platformTenantService, never()).updateOnboardingStatusByTenantCode(eq("  TENANT_001  "), eq("EMAIL_SENT"));
    }
}
