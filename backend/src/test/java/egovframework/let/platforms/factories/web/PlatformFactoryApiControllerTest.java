package egovframework.let.platforms.factories.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Collections;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import egovframework.let.platforms.factories.service.FactoryRegistrationResultVO;
import egovframework.let.platforms.factories.service.PlatformFactoryService;
import egovframework.let.platforms.factories.service.PlatformTenantDashboardItemVO;
import egovframework.let.platforms.factories.service.PlatformTenantDashboardResultVO;
import egovframework.let.platforms.factories.service.PlatformTenantDashboardSummaryVO;

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
    void listDashboardTenants_returnsSummaryAndItems() throws Exception {
        PlatformTenantDashboardItemVO item = new PlatformTenantDashboardItemVO();
        item.setTenantCode("TENANT_000001");
        item.setCompanyName("테스트업체");

        PlatformTenantDashboardSummaryVO summary = new PlatformTenantDashboardSummaryVO();
        summary.setTotal(1);
        summary.setActive(1);
        summary.setInactive(0);

        PlatformTenantDashboardResultVO result = new PlatformTenantDashboardResultVO();
        result.setSummary(summary);
        result.setItems(Collections.singletonList(item));

        when(platformFactoryService.listDashboardTenants(any())).thenReturn(result);

        mockMvc.perform(get("/api/platform-admin/dashboard/tenants")
                .param("pageIndex", "0")
                .param("pageSize", "10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.summary.total").value(1))
            .andExpect(jsonPath("$.items[0].tenantCode").value("TENANT_000001"));
    }
}
