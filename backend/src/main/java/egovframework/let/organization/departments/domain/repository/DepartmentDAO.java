package egovframework.let.organization.departments.domain.repository;

import java.util.List;
import java.util.Map;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.organization.departments.domain.model.DepartmentSearchConditionVO;
import egovframework.let.organization.departments.domain.model.DepartmentVO;

/**
 * 부서 관리를 위한 데이터 접근 클래스
 * @author SHMT-MES
 * @since 2026.07.14
 * @version 1.0
 */
@Repository("departmentDAO")
public class DepartmentDAO extends EgovAbstractMapper {

    public List<DepartmentVO> selectDepartmentList(DepartmentSearchConditionVO condition) throws Exception {
        return selectList("DepartmentDAO.selectDepartmentList", condition);
    }

    public DepartmentVO selectDepartmentById(Map<String, Object> params) throws Exception {
        return selectOne("DepartmentDAO.selectDepartmentById", params);
    }

    public Long selectTenantIdByCode(String tenantCode) throws Exception {
        return selectOne("DepartmentDAO.selectTenantIdByCode", tenantCode);
    }

    public Long insertDepartment(Map<String, Object> payload) throws Exception {
        return selectOne("DepartmentDAO.insertDepartment", payload);
    }

    public void updateDepartment(Map<String, Object> payload) throws Exception {
        update("DepartmentDAO.updateDepartment", payload);
    }

    public void deleteDepartment(Map<String, Object> params) throws Exception {
        delete("DepartmentDAO.deleteDepartment", params);
    }

    // 신규 -> 사용여부만 UPDATE (하드 삭제 deleteDepartment는 그대로 유지, 별도 경로로 추가)
    public void updateDepartmentActive(Map<String, Object> params) throws Exception {
        update("DepartmentDAO.updateDepartmentActive", params);
    }

    public int countChildDepartments(Map<String, Object> params) throws Exception {
        Integer count = selectOne("DepartmentDAO.countChildDepartments", params);
        return count == null ? 0 : count;
    }
}
