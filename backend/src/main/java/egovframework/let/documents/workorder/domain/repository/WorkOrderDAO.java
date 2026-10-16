package egovframework.let.documents.workorder.domain.repository;

import java.util.List;
import java.util.Map;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.documents.workorder.domain.model.WorkOrderSearchConditionVO;
import egovframework.let.documents.workorder.domain.model.WorkOrderVO;

/**
 * 작업지시 관리를 위한 데이터 접근 클래스
 * @author SHMT-MES
 * @since 2026.10.15
 * @version 1.0
 */
@Repository("workOrderDAO")
public class WorkOrderDAO extends EgovAbstractMapper {

    public List<WorkOrderVO> selectWorkOrderPagedList(WorkOrderSearchConditionVO condition) throws Exception {
        return selectList("WorkOrderDAO.selectWorkOrderPagedList", condition);
    }

    public int selectWorkOrderPagedCount(WorkOrderSearchConditionVO condition) throws Exception {
        Integer count = selectOne("WorkOrderDAO.selectWorkOrderPagedCount", condition);
        return count == null ? 0 : count;
    }

    public WorkOrderVO selectWorkOrderById(Map<String, Object> params) throws Exception {
        return selectOne("WorkOrderDAO.selectWorkOrderById", params);
    }

    public Long selectTenantIdByCode(String tenantCode) throws Exception {
        return selectOne("WorkOrderDAO.selectTenantIdByCode", tenantCode);
    }

    public Long selectUserIdByLoginCode(Map<String, Object> params) throws Exception {
        return selectOne("WorkOrderDAO.selectUserIdByLoginCode", params);
    }

    public int selectActiveMaterialCount(Map<String, Object> params) throws Exception {
        Integer count = selectOne("WorkOrderDAO.selectActiveMaterialCount", params);
        return count == null ? 0 : count;
    }

    public void lockTenantForNoGeneration(Long tenantId) throws Exception {
        selectOne("WorkOrderDAO.lockTenantForNoGeneration", tenantId);
    }

    public String selectMaxWorkdtNo(Map<String, Object> params) throws Exception {
        return selectOne("WorkOrderDAO.selectMaxWorkdtNo", params);
    }

    public Long insertWorkOrder(Map<String, Object> payload) throws Exception {
        return selectOne("WorkOrderDAO.insertWorkOrder", payload);
    }

    public int updateWorkOrder(Map<String, Object> payload) throws Exception {
        return update("WorkOrderDAO.updateWorkOrder", payload);
    }

    public int softDeleteWorkOrder(Map<String, Object> params) throws Exception {
        return update("WorkOrderDAO.softDeleteWorkOrder", params);
    }
}