package egovframework.let.documents.portal.service.impl;

import java.util.List;

import org.egovframe.rte.fdl.cmmn.EgovAbstractServiceImpl;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import egovframework.let.documents.portal.domain.model.HaccpPortalDocumentSearchConditionVO;
import egovframework.let.documents.portal.domain.model.HaccpPortalDocumentVO;
import egovframework.let.documents.portal.domain.repository.HaccpPortalDocumentDAO;
import egovframework.let.documents.portal.service.HaccpPortalDocumentService;
import lombok.RequiredArgsConstructor;

/**
 * HACCP 문서포탈 조회 서비스 구현
 */
@Service("haccpPortalDocumentService")
@RequiredArgsConstructor
public class HaccpPortalDocumentServiceImpl extends EgovAbstractServiceImpl implements HaccpPortalDocumentService {

    private final HaccpPortalDocumentDAO haccpPortalDocumentDAO;

    @Override
    public List<HaccpPortalDocumentVO> listPortalDocuments(String tenantCode) throws Exception {
        HaccpPortalDocumentSearchConditionVO condition = new HaccpPortalDocumentSearchConditionVO();
        condition.setTenantCode(normalizeTenantCode(tenantCode));
        return haccpPortalDocumentDAO.selectPortalDocuments(condition);
    }

    private String normalizeTenantCode(String tenantCode) {
        return StringUtils.hasText(tenantCode) ? tenantCode.trim().toUpperCase() : "";
    }
}
