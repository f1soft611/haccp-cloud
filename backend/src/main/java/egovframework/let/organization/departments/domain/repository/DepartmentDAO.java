package egovframework.let.organization.departments.domain.repository;

import java.util.List;
import java.util.Map;

import egovframework.let.organization.departments.domain.model.DepartmentSearchConditionVO;
import egovframework.let.organization.departments.domain.model.DepartmentVO;

/**
 * 부서 관리 DAO
 */
public interface DepartmentDAO {

    List<DepartmentVO> selectDepartmentList(DepartmentSearchConditionVO condition) throws Exception;

    DepartmentVO selectDepartmentById(Map<String, Object> params) throws Exception;

    Long selectTenantIdByCode(String tenantCode) throws Exception;

    Long insertDepartment(Map<String, Object> payload) throws Exception;

    void updateDepartment(Map<String, Object> payload) throws Exception;

    void deleteDepartment(Map<String, Object> params) throws Exception;

    int countChildDepartments(Map<String, Object> params) throws Exception;
}
