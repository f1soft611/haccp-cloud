package egovframework.let.documents.portal.service;

import java.util.List;

import egovframework.let.documents.portal.domain.model.HaccpPortalDocumentVO;

/**
 * HACCP 문서포탈 조회 서비스
 */
public interface HaccpPortalDocumentService {

    public List<HaccpPortalDocumentVO> listPortalDocuments(String tenantCode) throws Exception;
}
