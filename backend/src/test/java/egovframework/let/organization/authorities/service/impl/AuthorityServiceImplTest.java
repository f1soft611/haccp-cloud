package egovframework.let.organization.authorities.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import egovframework.let.organization.authorities.domain.repository.AuthorityDAO;
import egovframework.let.platform_admin.access.service.PlanAccessService;
import egovframework.let.uss.auth.service.RoleInfoVO;

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
}
