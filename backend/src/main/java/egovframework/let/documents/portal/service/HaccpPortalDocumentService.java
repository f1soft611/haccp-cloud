package egovframework.let.documents.portal.service;

import java.util.List;

import egovframework.let.documents.portal.domain.model.HaccpPortalDocumentVO;

/**
 * HACCP 문서포탈 조회 서비스
 */
public interface HaccpPortalDocumentService {

    // 업무분류(ID 또는 NONE), 등록주기, 키워드 검색조건 추가
    public List<HaccpPortalDocumentVO> listPortalDocuments(String tenantCode, String actorLoginCode, String roleCode,
            String categoryId, String cycle, String keyword) throws Exception;
}
