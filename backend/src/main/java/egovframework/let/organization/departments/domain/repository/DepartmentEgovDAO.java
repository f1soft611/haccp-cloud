package egovframework.let.organization.departments.domain.repository;

import java.util.List;
import java.util.Map;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.organization.departments.domain.model.DepartmentSearchConditionVO;
import egovframework.let.organization.departments.domain.model.DepartmentVO;

@Repository("departmentDAO")
public class DepartmentEgovDAO extends EgovAbstractMapper implements DepartmentDAO {

    @Override
    public List<DepartmentVO> selectDepartmentList(DepartmentSearchConditionVO condition) throws Exception {
        return selectList("DepartmentDAO.selectDepartmentList", condition);
    }

    @Override
    public DepartmentVO selectDepartmentById(Map<String, Object> params) throws Exception {
        return selectOne("DepartmentDAO.selectDepartmentById", params);
    }

    @Override
    public Long selectTenantIdByCode(String tenantCode) throws Exception {
        return selectOne("DepartmentDAO.selectTenantIdByCode", tenantCode);
    }

    @Override
    public Long insertDepartment(Map<String, Object> payload) throws Exception {
        return selectOne("DepartmentDAO.insertDepartment", payload);
    }

    @Override
    public void updateDepartment(Map<String, Object> payload) throws Exception {
        update("DepartmentDAO.updateDepartment", payload);
    }

    @Override
    public void deleteDepartment(Map<String, Object> params) throws Exception {
        delete("DepartmentDAO.deleteDepartment", params);
    }

    @Override
    public int countChildDepartments(Map<String, Object> params) throws Exception {
        Integer count = selectOne("DepartmentDAO.countChildDepartments", params);
        return count == null ? 0 : count;
    }
}
