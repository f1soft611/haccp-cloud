package egovframework.let.documents.haccpbase.works.domain.repository;

import java.util.List;
import java.util.Map;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.documents.haccpbase.works.domain.model.HaccpBaseWorkSearchConditionVO;
import egovframework.let.documents.haccpbase.works.domain.model.HaccpBaseWorkVO;

/**
 * HACCP 양식 업무 관리를 위한 데이터 접근 클래스
 * @author SHMT-MES
 * @since 2026.07.07
 * @version 1.0
 */
@Repository("haccpBaseWorkDAO")
public class HaccpBaseWorkDAO extends EgovAbstractMapper {

    public List<HaccpBaseWorkVO> selectWorkList(HaccpBaseWorkSearchConditionVO condition) throws Exception {
        return selectList("HaccpBaseWorkDAO.selectWorkList", condition);
    }

    public HaccpBaseWorkVO selectWorkById(Map<String, Object> params) throws Exception {
        return selectOne("HaccpBaseWorkDAO.selectWorkById", params);
    }

    public Long selectTenantIdByCode(String tenantCode) throws Exception {
        return selectOne("HaccpBaseWorkDAO.selectTenantIdByCode", tenantCode);
    }

    public Long selectLoginIdByTenantAndLoginCode(Map<String, Object> params) throws Exception {
        return selectOne("HaccpBaseWorkDAO.selectLoginIdByTenantAndLoginCode", params);
    }

    public Long selectUserIdByTenantAndLoginId(Map<String, Object> params) throws Exception {
        return selectOne("HaccpBaseWorkDAO.selectUserIdByTenantAndLoginId", params);
    }

    public Long insertWork(Map<String, Object> payload) throws Exception {
        return selectOne("HaccpBaseWorkDAO.insertWork", payload);
    }

    public void updateWork(Map<String, Object> payload) throws Exception {
        update("HaccpBaseWorkDAO.updateWork", payload);
    }

    public int updateWorkTemplate(Map<String, Object> payload) throws Exception {
        return update("HaccpBaseWorkDAO.updateWorkTemplate", payload);
    }

    public void deleteWorkAuthorityMappings(Map<String, Object> payload) throws Exception {
        delete("HaccpBaseWorkDAO.deleteWorkAuthorityMappings", payload);
    }

    public void insertWorkAuthorityMapping(Map<String, Object> payload) throws Exception {
        insert("HaccpBaseWorkDAO.insertWorkAuthorityMapping", payload);
    }
}
