package egovframework.let.organization.authorities.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Arrays;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import egovframework.let.organization.authorities.domain.repository.AuthorityDAO;
import egovframework.let.platform_admin.access.service.PlanAccessService;
import egovframework.let.uss.auth.service.RoleInfoVO;
import egovframework.let.organization.authorities.domain.model.AuthorityMenuSaveRequestVO;

class AuthorityServiceImplTest {

    @DisplayName("TENANT_ADMIN 시스템 권한은 비활성화할 수 없다")
    @Test
    void updateRoleUseAt_rejectsTenantAdmin() throws Exception {
        AuthorityDAO authorityDAO = mock(AuthorityDAO.class);
        PlanAccessService planAccessService = mock(PlanAccessService.class);

        AuthorityServiceImpl service = new AuthorityServiceImpl();
        ReflectionTestUtils.setField(service, "authorityDAO", authorityDAO);
        ReflectionTestUtils.setField(service, "planAccessService", planAccessService);

        RoleInfoVO persisted = new RoleInfoVO();
        persisted.setRoleId(10L);
        persisted.setRoleCode("TENANT_ADMIN");
        when(authorityDAO.selectRoleById(10L)).thenReturn(persisted);

        RoleInfoVO payload = new RoleInfoVO();
        payload.setUseAt("N");

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.updateRoleUseAt(10L, payload));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(authorityDAO).selectRoleById(10L);
    }

    @DisplayName("TENANT_USER 시스템 권한은 수정할 수 없다")
    @Test
    void updateRole_rejectsTenantUser() throws Exception {
        AuthorityDAO authorityDAO = mock(AuthorityDAO.class);
        PlanAccessService planAccessService = mock(PlanAccessService.class);

        AuthorityServiceImpl service = new AuthorityServiceImpl();
        ReflectionTestUtils.setField(service, "authorityDAO", authorityDAO);
        ReflectionTestUtils.setField(service, "planAccessService", planAccessService);

        RoleInfoVO persisted = new RoleInfoVO();
        persisted.setRoleId(11L);
        persisted.setRoleCode("TENANT_USER");
        when(authorityDAO.selectRoleById(11L)).thenReturn(persisted);

        RoleInfoVO payload = new RoleInfoVO();
        payload.setRoleNm("수정 시도");
        payload.setUseAt("Y");

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.updateRole(11L, payload));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(authorityDAO).selectRoleById(11L);
    }

    @DisplayName("권한-메뉴 저장 시 tenant permission이 없으면 먼저 기본 권한을 보장한다")
    @Test
    void replaceRoleMenus_ensuresTenantPermissions() throws Exception {
        AuthorityDAO authorityDAO = mock(AuthorityDAO.class);
        PlanAccessService planAccessService = mock(PlanAccessService.class);

        AuthorityServiceImpl service = new AuthorityServiceImpl();
        ReflectionTestUtils.setField(service, "authorityDAO", authorityDAO);
        ReflectionTestUtils.setField(service, "planAccessService", planAccessService);

        when(planAccessService.resolveTenantIdByTenantCode("TENANT_001")).thenReturn(10L);
        when(planAccessService.resolveTenantPlanMenuCodes("TENANT_001")).thenReturn(Arrays.asList("MENU_TENANT_USERS"));

        AuthorityMenuSaveRequestVO payload = new AuthorityMenuSaveRequestVO();
        payload.setMenuIds(Arrays.asList("MENU_TENANT_USERS"));

        service.replaceRoleMenus("TENANT_ADMIN", "TENANT_001", payload);

        verify(authorityDAO).upsertPermissionType(10L, "PERM_READ", "조회");
        verify(authorityDAO).upsertPermissionType(10L, "PERM_WRITE", "등록/수정");
    }

    @DisplayName("TENANT_ADMIN은 플랜 허용 메뉴가 아니라 실제 테넌트 메뉴 전체를 권한 부여한다")
    @Test
    void replaceRoleMenus_assignsAllTenantMenusToTenantAdmin() throws Exception {
        AuthorityDAO authorityDAO = mock(AuthorityDAO.class);
        PlanAccessService planAccessService = mock(PlanAccessService.class);

        AuthorityServiceImpl service = new AuthorityServiceImpl();
        ReflectionTestUtils.setField(service, "authorityDAO", authorityDAO);
        ReflectionTestUtils.setField(service, "planAccessService", planAccessService);

        when(planAccessService.resolveTenantIdByTenantCode("TENANT_001")).thenReturn(10L);
        when(planAccessService.resolveTenantPlanMenuCodes("TENANT_001")).thenReturn(Arrays.asList("MENU_TENANT_USERS"));
        when(authorityDAO.selectAllMenuCodesByTenantCode("TENANT_001")).thenReturn(
                Arrays.asList("MENU_TENANT_DASHBOARD", "MENU_TENANT_USERS", "MENU_TENANT_DOCUMENTS"));
        when(authorityDAO.selectMenuIdByCode("MENU_TENANT_DASHBOARD")).thenReturn(101L);
        when(authorityDAO.selectMenuIdByCode("MENU_TENANT_USERS")).thenReturn(102L);
        when(authorityDAO.selectMenuIdByCode("MENU_TENANT_DOCUMENTS")).thenReturn(103L);

        AuthorityMenuSaveRequestVO payload = new AuthorityMenuSaveRequestVO();
        payload.setMenuIds(Arrays.asList("MENU_TENANT_USERS"));

        service.replaceRoleMenus("TENANT_ADMIN", "TENANT_001", payload);

        verify(authorityDAO).selectAllMenuCodesByTenantCode("TENANT_001");
        verify(authorityDAO, org.mockito.Mockito.times(3)).insertRoleMenuPermission(org.mockito.ArgumentMatchers.argThat(item ->
                "MENU_TENANT_DASHBOARD".equals(item.getMenuCode())
                        || "MENU_TENANT_USERS".equals(item.getMenuCode())
                        || "MENU_TENANT_DOCUMENTS".equals(item.getMenuCode())
        ));
    }

    @DisplayName("테넌트 전체 메뉴 조회가 실패하면 플랜 허용 메뉴로 안전하게 fallback 한다")
    @Test
    void replaceRoleMenus_fallsBackToPlanMenusWhenTenantMenuQueryFails() throws Exception {
        AuthorityDAO authorityDAO = mock(AuthorityDAO.class);
        PlanAccessService planAccessService = mock(PlanAccessService.class);

        AuthorityServiceImpl service = new AuthorityServiceImpl();
        ReflectionTestUtils.setField(service, "authorityDAO", authorityDAO);
        ReflectionTestUtils.setField(service, "planAccessService", planAccessService);

        when(planAccessService.resolveTenantIdByTenantCode("TENANT_001")).thenReturn(10L);
        when(planAccessService.resolveTenantPlanMenuCodes("TENANT_001")).thenReturn(Arrays.asList("MENU_TENANT_USERS"));
        when(authorityDAO.selectAllMenuCodesByTenantCode("TENANT_001")).thenThrow(new RuntimeException("menu read failed"));
        when(authorityDAO.selectMenuIdByCode("MENU_TENANT_USERS")).thenReturn(102L);
        when(authorityDAO.selectRoleIdByCode("TENANT_001", "TENANT_ADMIN")).thenReturn(99L);

        AuthorityMenuSaveRequestVO payload = new AuthorityMenuSaveRequestVO();
        payload.setMenuIds(Arrays.asList("MENU_TENANT_USERS"));

        service.replaceRoleMenus("TENANT_ADMIN", "TENANT_001", payload);

        verify(authorityDAO).selectAllMenuCodesByTenantCode("TENANT_001");
        verify(authorityDAO).insertRoleMenuPermission(org.mockito.ArgumentMatchers.argThat(item ->
                "MENU_TENANT_USERS".equals(item.getMenuCode()) && 99L == item.getRoleId()
        ));
    }

    @DisplayName("역할 코드 기반 저장 시 실제 role_id를 조회해 null 삽입을 방지한다")
    @Test
    void replaceRoleMenus_resolvesRealRoleIdBeforeInsert() throws Exception {
        AuthorityDAO authorityDAO = mock(AuthorityDAO.class);
        PlanAccessService planAccessService = mock(PlanAccessService.class);

        AuthorityServiceImpl service = new AuthorityServiceImpl();
        ReflectionTestUtils.setField(service, "authorityDAO", authorityDAO);
        ReflectionTestUtils.setField(service, "planAccessService", planAccessService);

        when(planAccessService.resolveTenantIdByTenantCode("TENANT_001")).thenReturn(10L);
        when(planAccessService.resolveTenantPlanMenuCodes("TENANT_001")).thenReturn(Arrays.asList("MENU_TENANT_USERS"));
        when(authorityDAO.selectAllMenuCodesByTenantCode("TENANT_001")).thenReturn(Arrays.asList("MENU_TENANT_USERS"));
        when(authorityDAO.selectMenuIdByCode("MENU_TENANT_USERS")).thenReturn(102L);
        when(authorityDAO.selectRoleIdByCode("TENANT_001", "TENANT_ADMIN")).thenReturn(99L);

        AuthorityMenuSaveRequestVO payload = new AuthorityMenuSaveRequestVO();
        payload.setMenuIds(Arrays.asList("MENU_TENANT_USERS"));

        service.replaceRoleMenus("TENANT_ADMIN", "TENANT_001", payload);

        verify(authorityDAO).insertRoleMenuPermission(org.mockito.ArgumentMatchers.argThat(item ->
                99L == item.getRoleId() && "MENU_TENANT_USERS".equals(item.getMenuCode())
        ));
    }

    @DisplayName("테넌트 관리자 역할이 없으면 자동 생성 후 메뉴 매핑을 수행한다")
    @Test
    void replaceRoleMenus_createsMissingTenantAdminRoleBeforeInsert() throws Exception {
        AuthorityDAO authorityDAO = mock(AuthorityDAO.class);
        PlanAccessService planAccessService = mock(PlanAccessService.class);

        AuthorityServiceImpl service = new AuthorityServiceImpl();
        ReflectionTestUtils.setField(service, "authorityDAO", authorityDAO);
        ReflectionTestUtils.setField(service, "planAccessService", planAccessService);

        when(planAccessService.resolveTenantIdByTenantCode("TENANT_001")).thenReturn(10L);
        when(planAccessService.resolveTenantPlanMenuCodes("TENANT_001")).thenReturn(Arrays.asList("MENU_TENANT_USERS"));
        when(authorityDAO.selectAllMenuCodesByTenantCode("TENANT_001")).thenReturn(Arrays.asList("MENU_TENANT_USERS"));
        when(authorityDAO.selectMenuIdByCode("MENU_TENANT_USERS")).thenReturn(102L);
        when(authorityDAO.selectRoleIdByCode("TENANT_001", "TENANT_ADMIN")).thenReturn(null, 99L);

        AuthorityMenuSaveRequestVO payload = new AuthorityMenuSaveRequestVO();
        payload.setMenuIds(Arrays.asList("MENU_TENANT_USERS"));

        service.replaceRoleMenus("TENANT_ADMIN", "TENANT_001", payload);

        verify(authorityDAO).insertRole(org.mockito.ArgumentMatchers.argThat(item ->
                "TENANT_ADMIN".equals(item.getRoleCode()) && "TENANT_001".equals(item.getTenantCode())
        ));
        verify(authorityDAO).insertRoleMenuPermission(org.mockito.ArgumentMatchers.argThat(item ->
                99L == item.getRoleId() && "MENU_TENANT_USERS".equals(item.getMenuCode())
        ));
    }

}
