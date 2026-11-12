package egovframework.let.platform_admin.access.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import egovframework.let.platform_admin.access.domain.model.PlanSummaryVO;

import egovframework.let.platform_admin.access.domain.repository.CentralPlanAccessDAO;
import egovframework.let.platform_admin.access.domain.repository.PlanAccessDAO;
import egovframework.let.platform_admin.tenants.context.PlatformTenantCodes;
import egovframework.let.platform_admin.tenants.context.TenantContextHolder;

@ExtendWith(MockitoExtension.class)
class PlanAccessServiceImplTest {

    @Mock
    private PlanAccessDAO planAccessDAO;

    @Mock
    private CentralPlanAccessDAO centralPlanAccessDAO;

    @InjectMocks
    private PlanAccessServiceImpl planAccessService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.clear();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    void resolveTenantPlanMenuCodes_keepsPlanMetadataOnPlatformDb() throws Exception {
        TenantContextHolder.setTenantCode("TENANT_0001");
        TenantContextHolder.setDbKey("TENANT_0001");

        when(centralPlanAccessDAO.selectPlanSchemaTableCount()).thenReturn(3);

        when(centralPlanAccessDAO.selectTenantIdByTenantCode("TENANT_0001")).thenAnswer(invocation -> {
            assertEquals(PlatformTenantCodes.CANONICAL, TenantContextHolder.getDbKey());
            return 42L;
        });

        when(centralPlanAccessDAO.selectActivePlanCode(42L, "ACTIVE")).thenAnswer(invocation -> {
            assertEquals(PlatformTenantCodes.CANONICAL, TenantContextHolder.getDbKey());
            return "BASIC";
        });

        when(centralPlanAccessDAO.selectPlanMenuCodes("BASIC")).thenAnswer(invocation -> {
            assertEquals(PlatformTenantCodes.CANONICAL, TenantContextHolder.getDbKey());
            return Arrays.asList("MENU_A", "MENU_B");
        });

        assertEquals(Arrays.asList("MENU_A", "MENU_B"), planAccessService.resolveTenantPlanMenuCodes("TENANT_0001"));
        assertEquals("TENANT_0001", TenantContextHolder.getDbKey());
    }

    @Test
    void resolveTenantPlanMenuCodes_acceptsNumericTenantIdsAsFallback() throws Exception {
        when(centralPlanAccessDAO.selectPlanSchemaTableCount()).thenReturn(3);
        when(centralPlanAccessDAO.selectTenantIdByTenantCode("42")).thenReturn(null);
        when(centralPlanAccessDAO.selectActivePlanCode(42L, "ACTIVE")).thenReturn("BASIC");
        when(centralPlanAccessDAO.selectPlanMenuCodes("BASIC")).thenReturn(Arrays.asList("MENU_A", "MENU_B"));

        assertEquals(Arrays.asList("MENU_A", "MENU_B"), planAccessService.resolveTenantPlanMenuCodes("42"));
    }

    @Test
    void resolveTenantPlanMenuCodes_doesNotTreatLongNumericTenantCodesAsTenantIds() throws Exception {
        when(centralPlanAccessDAO.selectTenantIdByTenantCode("2133453253")).thenReturn(null);

        assertEquals(null, planAccessService.resolveTenantIdByTenantCode("2133453253"));
        assertEquals(Collections.emptyList(), planAccessService.resolveTenantPlanMenuCodes("2133453253"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void listPlans_passesNormalizedSearchConditions() throws Exception {
        when(centralPlanAccessDAO.selectPlanSchemaTableCount()).thenReturn(3);
        when(centralPlanAccessDAO.selectPlanList(anyMap())).thenReturn(Collections.<PlanSummaryVO>emptyList());

        planAccessService.listPlans("CODE", "  ba ", "y");

        ArgumentCaptor<Map<String, Object>> captor = ArgumentCaptor.forClass(Map.class);
        verify(centralPlanAccessDAO).selectPlanList(captor.capture());
        assertEquals("code", captor.getValue().get("searchField"));
        assertEquals("ba", captor.getValue().get("searchKeyword"));
        assertEquals("Y", captor.getValue().get("useAt"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void listPlans_ignoresBlankAndAllConditions() throws Exception {
        when(centralPlanAccessDAO.selectPlanSchemaTableCount()).thenReturn(3);
        when(centralPlanAccessDAO.selectPlanList(anyMap())).thenReturn(Collections.<PlanSummaryVO>emptyList());

        planAccessService.listPlans(null, " ", "all");

        ArgumentCaptor<Map<String, Object>> captor = ArgumentCaptor.forClass(Map.class);
        verify(centralPlanAccessDAO).selectPlanList(captor.capture());
        assertEquals("name", captor.getValue().get("searchField"));
        assertNull(captor.getValue().get("searchKeyword"));
        assertNull(captor.getValue().get("useAt"));
    }
}
