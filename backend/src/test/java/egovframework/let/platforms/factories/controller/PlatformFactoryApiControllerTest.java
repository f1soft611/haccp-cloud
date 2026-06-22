package egovframework.let.platforms.factories.controller;

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

import egovframework.let.platforms.factories.domain.model.FactoryRegistrationResultVO;
import egovframework.let.platforms.factories.domain.model.SampleTenantVO;
import egovframework.let.platforms.factories.service.PlatformFactoryService;

class PlatformFactoryApiControllerTest {

    private MockMvc mockMvc;
    private PlatformFactoryService platformFactoryService;

    @BeforeEach
    void setUp() {
        PlatformFactoryApiController controller = new PlatformFactoryApiController();
        platformFactoryService = mock(PlatformFactoryService.class);

        ReflectionTestUtils.setField(controller, "platformFactoryService", platformFactoryService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void issueTenantCode_returnsExpectedPayload() throws Exception {
        FactoryRegistrationResultVO created = new FactoryRegistrationResultVO();
        created.setTenantCode("TENANT_000001");
        created.setFactoryNm("테스트업체");
        created.setAdminEmail("admin@test.com");
        created.setCorporateNumber("CORP-001");
        created.setCreatedAt("2026-06-22T10:00:00Z");

        when(platformFactoryService.registerFactory(any())).thenReturn(created);

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

        when(platformFactoryService.listRecentTenants(5)).thenReturn(Arrays.asList(first, second));

        mockMvc.perform(get("/api/tenants/samples"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].tenantCode").value("TENANT_000001"))
            .andExpect(jsonPath("$[1].tenantCode").value("TENANT_000002"));
    }
}
