package egovframework.let.documents.portal.domain.repository;

import java.util.List;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.documents.portal.domain.model.HaccpPortalDocumentSearchConditionVO;
import egovframework.let.documents.portal.domain.model.HaccpPortalDocumentVO;

/**
 * HACCP 문서포탈 조회 DAO
 */
@Repository("haccpPortalDocumentDAO")
public class HaccpPortalDocumentDAO extends EgovAbstractMapper {

    public List<HaccpPortalDocumentVO> selectPortalDocuments(HaccpPortalDocumentSearchConditionVO condition)
            throws Exception {
        return selectList("HaccpPortalDocumentDAO.selectPortalDocuments", condition);
    }
}
