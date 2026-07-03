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
}
