package egovframework.let.documents.haccpwork.domain.repository;

import java.util.List;
import java.util.Map;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.documents.haccpwork.domain.model.HaccpWorkSearchConditionVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkVO;

/**
 * HACCP 업무 조회를 위한 데이터 접근 클래스
 * @author SHMT-MES
 * @since 2026.07.16
 * @version 1.0
 */
@Repository("haccpWorkDAO")
public class HaccpWorkDAO extends EgovAbstractMapper {

    public List<HaccpWorkVO> selectMyWorkList(HaccpWorkSearchConditionVO condition) throws Exception {
        return selectList("HaccpWorkDAO.selectMyWorkList", condition);
    }

    public List<HaccpWorkVO> selectDocumentList(HaccpWorkSearchConditionVO condition) throws Exception {
        return selectList("HaccpWorkDAO.selectDocumentList", condition);
    }

    public HaccpWorkVO selectDraftTemplateByWorkId(Map<String, Object> params) throws Exception {
        return selectOne("HaccpWorkDAO.selectDraftTemplateByWorkId", params);
    }

    public HaccpWorkVO selectDraftTemplateByApprovalId(Map<String, Object> params) throws Exception {
        return selectOne("HaccpWorkDAO.selectDraftTemplateByApprovalId", params);
    }

    public Integer selectWorkAssigneeAccessCount(Map<String, Object> params) throws Exception {
        return selectOne("HaccpWorkDAO.selectWorkAssigneeAccessCount", params);
    }

    public Long selectTenantIdByCode(String tenantCode) throws Exception {
        return selectOne("HaccpWorkDAO.selectTenantIdByCode", tenantCode);
    }

    public Long selectLoginIdByTenantAndLoginCode(Map<String, Object> params) throws Exception {
        return selectOne("HaccpWorkDAO.selectLoginIdByTenantAndLoginCode", params);
    }

    public Long selectUserIdByTenantAndLoginId(Map<String, Object> params) throws Exception {
        return selectOne("HaccpWorkDAO.selectUserIdByTenantAndLoginId", params);
    }

    public Long selectLoginIdByTenantAndUserOrLoginId(Map<String, Object> params) throws Exception {
        return selectOne("HaccpWorkDAO.selectLoginIdByTenantAndUserOrLoginId", params);
    }

    public Map<String, Object> selectApprovalActorProfile(Map<String, Object> params) throws Exception {
        return selectOne("HaccpWorkDAO.selectApprovalActorProfile", params);
    }

    public void insertElectronicApprovalMain(Map<String, Object> params) throws Exception {
        insert("HaccpWorkDAO.insertElectronicApprovalMain", params);
    }

    public void insertElectronicApprovalLine(Map<String, Object> params) throws Exception {
        insert("HaccpWorkDAO.insertElectronicApprovalLine", params);
    }

    public Map<String, Object> selectApprovalMainById(Map<String, Object> params) throws Exception {
        return selectOne("HaccpWorkDAO.selectApprovalMainById", params);
    }

    public Long selectApprovalLineLoginId(Map<String, Object> params) throws Exception {
        return selectOne("HaccpWorkDAO.selectApprovalLineLoginId", params);
    }

    public Long selectApprovalReferenceLoginId(Map<String, Object> params) throws Exception {
        return selectOne("HaccpWorkDAO.selectApprovalReferenceLoginId", params);
    }

    public Integer selectMaxDraftedExeSeqByApprovalId(Map<String, Object> params) throws Exception {
        return selectOne("HaccpWorkDAO.selectMaxDraftedExeSeqByApprovalId", params);
    }

    public Integer selectLatestCompletedDraftedSeqByApprovalId(Map<String, Object> params) throws Exception {
        return selectOne("HaccpWorkDAO.selectLatestCompletedDraftedSeqByApprovalId", params);
    }

    public Integer selectLatestCompletedDraftedSeqByApprovalAndLogin(Map<String, Object> params) throws Exception {
        return selectOne("HaccpWorkDAO.selectLatestCompletedDraftedSeqByApprovalAndLogin", params);
    }

    public int updateElectronicApprovalLineStatus(Map<String, Object> params) throws Exception {
        return update("HaccpWorkDAO.updateElectronicApprovalLineStatus", params);
    }

    public int updateElectronicApprovalReferenceLineStatus(Map<String, Object> params) throws Exception {
        return update("HaccpWorkDAO.updateElectronicApprovalReferenceLineStatus", params);
    }

    public int updateElectronicApprovalLineArrival(Map<String, Object> params) throws Exception {
        return update("HaccpWorkDAO.updateElectronicApprovalLineArrival", params);
    }

    public int updateElectronicApprovalLineToPending(Map<String, Object> params) throws Exception {
        return update("HaccpWorkDAO.updateElectronicApprovalLineToPending", params);
    }

    public int updateElectronicApprovalMainStatus(Map<String, Object> params) throws Exception {
        return update("HaccpWorkDAO.updateElectronicApprovalMainStatus", params);
    }

    public Long selectLatestPreApplyApprovalIdByWorkAndLogin(Map<String, Object> params) throws Exception {
        return selectOne("HaccpWorkDAO.selectLatestPreApplyApprovalIdByWorkAndLogin", params);
    }

    public Map<String, Object> selectLatestApprovalStatusByWorkAndLogin(Map<String, Object> params) throws Exception {
        return selectOne("HaccpWorkDAO.selectLatestApprovalStatusByWorkAndLogin", params);
    }

    public int updateElectronicApprovalMainDraftContent(Map<String, Object> params) throws Exception {
        return update("HaccpWorkDAO.updateElectronicApprovalMainDraftContent", params);
    }

    public int deleteElectronicApprovalLinesByApprovalId(Map<String, Object> params) throws Exception {
        return delete("HaccpWorkDAO.deleteElectronicApprovalLinesByApprovalId", params);
    }
}
