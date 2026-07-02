package egovframework.let.organization.departments.service;

import java.util.List;

import egovframework.let.organization.departments.domain.model.DepartmentSaveRequestVO;
import egovframework.let.organization.departments.domain.model.DepartmentVO;

/**
 * 부서 관리 서비스
 */
public interface DepartmentService {

    List<DepartmentVO> listDepartments(String tenantCode, String name, String active) throws Exception;

    DepartmentVO createDepartment(DepartmentSaveRequestVO payload) throws Exception;

    DepartmentVO updateDepartment(Long departmentId, DepartmentSaveRequestVO payload) throws Exception;

    void deleteDepartment(Long departmentId, String tenantCode) throws Exception;
}
