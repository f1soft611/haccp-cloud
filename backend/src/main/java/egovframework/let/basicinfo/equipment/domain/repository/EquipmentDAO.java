package egovframework.let.basicinfo.equipment.domain.repository;

import java.util.List;
import java.util.Map;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.basicinfo.equipment.domain.model.EquipmentSearchConditionVO;
import egovframework.let.basicinfo.equipment.domain.model.EquipmentVO;

/**
 * 설비 관리를 위한 데이터 접근 클래스
 * @author SHMT-MES
 * @since 2026.08.14
 * @version 1.0
 */
@Repository("equipmentDAO")
public class EquipmentDAO extends EgovAbstractMapper {

    public List<EquipmentVO> selectEquipmentPagedList(EquipmentSearchConditionVO condition) throws Exception {
        return selectList("EquipmentDAO.selectEquipmentPagedList", condition);
    }

    public int selectEquipmentPagedCount(EquipmentSearchConditionVO condition) throws Exception {
        Integer count = selectOne("EquipmentDAO.selectEquipmentPagedCount", condition);
        return count == null ? 0 : count;
    }

    public EquipmentVO selectEquipmentById(Map<String, Object> params) throws Exception {
        return selectOne("EquipmentDAO.selectEquipmentById", params);
    }

    public Long selectTenantIdByCode(String tenantCode) throws Exception {
        return selectOne("EquipmentDAO.selectTenantIdByCode", tenantCode);
    }

    public Long selectUserIdByLoginCode(Map<String, Object> params) throws Exception {
        return selectOne("EquipmentDAO.selectUserIdByLoginCode", params);
    }

    public void lockTenantForCodeGeneration(Long tenantId) throws Exception {
        selectOne("EquipmentDAO.lockTenantForCodeGeneration", tenantId);
    }

    public String selectMaxEquipSysCd(Long tenantId) throws Exception {
        return selectOne("EquipmentDAO.selectMaxEquipSysCd", tenantId);
    }

    public Long insertEquipment(Map<String, Object> payload) throws Exception {
        return selectOne("EquipmentDAO.insertEquipment", payload);
    }

    public void updateEquipment(Map<String, Object> payload) throws Exception {
        update("EquipmentDAO.updateEquipment", payload);
    }

    public void deleteEquipment(Map<String, Object> params) throws Exception {
        delete("EquipmentDAO.deleteEquipment", params);
    }
}
