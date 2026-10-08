package egovframework.let.basicinfo.commoncode.service;

import java.util.Map;

import egovframework.let.basicinfo.commoncode.domain.model.CommonCodeSaveRequestVO;

/**
 * 공통코드 관리를 위한 서비스 인터페이스
 * @author SHMT-MES
 * @since 2026.10.08
 * @version 1.0
 */
public interface CommonCodeService {

    /** 테넌트의 공통코드 그룹/상세 전체 조회 (groups, details) */
    Map<String, Object> getCommonCodes(String tenantCode) throws Exception;

    /** 화면 전체를 받아 DB를 동기화 (upsert + 누락 삭제) */
    void saveCommonCodes(CommonCodeSaveRequestVO payload) throws Exception;
}