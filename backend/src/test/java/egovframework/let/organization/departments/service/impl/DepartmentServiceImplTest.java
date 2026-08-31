package egovframework.let.organization.departments.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import egovframework.let.organization.departments.domain.model.DepartmentVO;
import egovframework.let.organization.departments.domain.repository.DepartmentDAO;

class DepartmentServiceImplTest {

    @DisplayName("하위 부서가 있으면 미사용으로 전환할 수 없다")
    @Test
    void updateDepartmentActive_rejectsDeactivateWithChildren() throws Exception {
        DepartmentDAO departmentDAO = mock(DepartmentDAO.class);

        DepartmentServiceImpl service = new DepartmentServiceImpl();
        ReflectionTestUtils.setField(service, "departmentDAO", departmentDAO);

        when(departmentDAO.selectTenantIdByCode("TENANT_A")).thenReturn(1L);

        Map<String, Object> checkParams = new HashMap<String, Object>();
        checkParams.put("departmentId", 10L);
        checkParams.put("tenantId", 1L);
        when(departmentDAO.countChildDepartments(checkParams)).thenReturn(2);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.updateDepartmentActive(10L, "TENANT_A", false));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        verify(departmentDAO, never()).updateDepartmentActive(anyMap());
    }

    @DisplayName("하위 부서가 있어도 사용 상태로 되돌리는 것은 허용한다")
    @Test
    void updateDepartmentActive_allowsActivateEvenWithChildren() throws Exception {
        DepartmentDAO departmentDAO = mock(DepartmentDAO.class);

        DepartmentServiceImpl service = new DepartmentServiceImpl();
        ReflectionTestUtils.setField(service, "departmentDAO", departmentDAO);

        when(departmentDAO.selectTenantIdByCode("TENANT_A")).thenReturn(1L);
        DepartmentVO persisted = new DepartmentVO();
        persisted.setDepartmentId(10L);
        persisted.setActive(true);
        when(departmentDAO.selectDepartmentById(anyMap())).thenReturn(persisted);

        DepartmentVO result = service.updateDepartmentActive(10L, "TENANT_A", true);

        assertEquals(10L, result.getDepartmentId());
        verify(departmentDAO, never()).countChildDepartments(anyMap());
        verify(departmentDAO).updateDepartmentActive(ArgumentMatchers.argThat(params ->
                "Y".equals(params.get("useAt"))
                        && Long.valueOf(10L).equals(params.get("departmentId"))
                        && Long.valueOf(1L).equals(params.get("tenantId"))
        ));
    }
}