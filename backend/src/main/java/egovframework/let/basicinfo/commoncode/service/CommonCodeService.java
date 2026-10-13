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
//    void saveCommonCodes(CommonCodeSaveRequestVO payload) throws Exception;
    // 기존 -> void saveCommonCodes(CommonCodeSaveRequestVO payload)  (그룹+상세 전체 교체, 누락 삭제)
    // 변경 -> 그룹(플랫폼관리자)과 상세 저장을 분리, 물리 삭제 없음
    /** payload.groups를 upsert, 없는 그룹은 use_at = 'N' */
    void saveGroups(CommonCodeSaveRequestVO payload) throws Exception;

    /** payload.details를 upsert (삭제 없음). 상세 그룹은 사용 중이어야 함 */
    void saveItems(CommonCodeSaveRequestVO payload) throws Exception;
}