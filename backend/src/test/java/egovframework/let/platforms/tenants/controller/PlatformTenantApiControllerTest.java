package egovframework.let.platforms.tenants.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Arrays;
import java.util.Collections;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import egovframework.let.platforms.tenants.domain.model.SampleTenantVO;
import egovframework.let.platforms.tenants.domain.model.TenantRegistrationResultVO;
import egovframework.let.platforms.tenants.service.PlatformTenantService;

class PlatformTenantApiControllerTest {

    private MockMvc mockMvc;
    private PlatformTenantService platformTenantService;

    @BeforeEach
    void setUp() {
        PlatformTenantApiController controller = new PlatformTenantApiController();
        platformTenantService = mock(PlatformTenantService.class);

        ReflectionTestUtils.setField(controller, "platformTenantService", platformTenantService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void issueTenantCode_returnsExpectedPayload() throws Exception {
        TenantRegistrationResultVO created = new TenantRegistrationResultVO();
        created.setTenantCode("TENANT_000001");
        created.setTenantNm("테스트업체");
        created.setAdminEmail("admin@test.com");
        created.setCorporateNumber("CORP-001");
        created.setCreatedAt("2026-06-22T10:00:00Z");

        when(platformTenantService.registerTenant(any())).thenReturn(created);

        mockMvc.perform(post("/api/tenants/issue-code")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"companyName\":\"테스트업체\",\"businessRegistrationNumber\":\"123-45-67890\",\"corporateNumber\":\"CORP-001\",\"businessType\":\"식품제조\",\"businessCategory\":\"즉석조리식품\",\"adminEmail\":\"admin@test.com\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.tenantCode").value("TENANT_000001"))
            .andExpect(jsonPath("$.companyName").value("테스트업체"))
            .andExpect(jsonPath("$.businessRegistrationNumber").value("123-45-67890"))
            .andExpect(jsonPath("$.corporateNumber").value("CORP-001"));
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

        mockMvc.perform(get("/api/tenants/samples"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].tenantCode").value("TENANT_000001"))
            .andExpect(jsonPath("$[1].tenantCode").value("TENANT_000002"));
    }
}
