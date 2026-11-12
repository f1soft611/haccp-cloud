package egovframework.let.documents.haccpbase.works.service;

import java.util.List;

import egovframework.let.documents.haccpbase.works.domain.model.HaccpBaseWorkSaveRequestVO;
import egovframework.let.documents.haccpbase.works.domain.model.HaccpBaseWorkTemplateSaveRequestVO;
import egovframework.let.documents.haccpbase.works.domain.model.HaccpBaseWorkVO;

/**
 * HACCP 양식 업무 관리를 위한 서비스 인터페이스 클래스
 * @author SHMT-MES
 * @since 2026.07.07
 * @version 1.0
 */
public interface HaccpBaseWorkService {

    // 업무분류, 키워드 조건을 서버에서 거르도록 파라미터 추가
    public List<HaccpBaseWorkVO> listWorks(String tenantCode, String active, Long categoryId, String keyword) throws Exception;

    public HaccpBaseWorkVO getWorkById(Long id, String tenantCode) throws Exception;

    public HaccpBaseWorkVO createWork(HaccpBaseWorkSaveRequestVO payload, String actorLoginCode) throws Exception;

    public HaccpBaseWorkVO updateWork(Long id, HaccpBaseWorkSaveRequestVO payload, String actorLoginCode)
            throws Exception;

    public HaccpBaseWorkVO saveWorkTemplate(
            Long id,
            String tenantCode,
            HaccpBaseWorkTemplateSaveRequestVO payload,
            String actorLoginCode
    ) throws Exception;
}
