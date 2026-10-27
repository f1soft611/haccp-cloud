package egovframework.let.documents.portal.service;

import java.util.List;

import egovframework.let.documents.portal.domain.model.HaccpPortalDocumentVO;

/**
 * HACCP 문서포탈 조회 서비스
 */
public interface HaccpPortalDocumentService {

    // 기존 -> listPortalDocuments(String tenantCode)
    // 변경 -> 로그인 코드와 역할 코드를 받아 관리자 외 역할은 본인 담당 업무만 조회
    public List<HaccpPortalDocumentVO> listPortalDocuments(String tenantCode, String actorLoginCode, String roleCode) throws Exception;
}
