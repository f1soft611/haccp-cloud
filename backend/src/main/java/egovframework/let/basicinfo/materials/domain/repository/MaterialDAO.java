package egovframework.let.basicinfo.materials.domain.repository;

import java.util.List;
import java.util.Map;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.basicinfo.materials.domain.model.MaterialSearchConditionVO;
import egovframework.let.basicinfo.materials.domain.model.MaterialVO;

/**
 * 품목 관리를 위한 데이터 접근 클래스
 * @author SHMT-MES
 * @since 2026.08.14
 * @version 1.0
 */
@Repository("materialDAO")
public class MaterialDAO extends EgovAbstractMapper {

    public List<MaterialVO> selectMaterialPagedList(MaterialSearchConditionVO condition) throws Exception {
        return selectList("MaterialDAO.selectMaterialPagedList", condition);
    }

    public int selectMaterialPagedCount(MaterialSearchConditionVO condition) throws Exception {
        Integer count = selectOne("MaterialDAO.selectMaterialPagedCount", condition);
        return count == null ? 0 : count;
    }

    public MaterialVO selectMaterialById(Map<String, Object> params) throws Exception {
        return selectOne("MaterialDAO.selectMaterialById", params);
    }

    public Long selectTenantIdByCode(String tenantCode) throws Exception {
        return selectOne("MaterialDAO.selectTenantIdByCode", tenantCode);
    }

    public Long selectUserIdByLoginCode(Map<String, Object> params) throws Exception {
        return selectOne("MaterialDAO.selectUserIdByLoginCode", params);
    }

    public void lockTenantForCodeGeneration(Long tenantId) throws Exception {
        selectOne("MaterialDAO.lockTenantForCodeGeneration", tenantId);
    }

    public String selectMaxMaterialCode(Long tenantId) throws Exception {
        return selectOne("MaterialDAO.selectMaxMaterialCode", tenantId);
    }

    public Long insertMaterial(Map<String, Object> payload) throws Exception {
        return selectOne("MaterialDAO.insertMaterial", payload);
    }

    public void updateMaterial(Map<String, Object> payload) throws Exception {
        update("MaterialDAO.updateMaterial", payload);
    }

    public void softDeleteMaterial(Map<String, Object> params) throws Exception {
        update("MaterialDAO.softDeleteMaterial", params);
    }
}
