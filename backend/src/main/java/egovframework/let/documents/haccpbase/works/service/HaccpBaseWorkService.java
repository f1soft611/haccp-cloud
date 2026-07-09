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

    public List<HaccpBaseWorkVO> listWorks(String tenantCode, String active) throws Exception;

    public HaccpBaseWorkVO createWork(HaccpBaseWorkSaveRequestVO payload, String actorLoginCode) throws Exception;

    public HaccpBaseWorkVO updateWork(Long id, HaccpBaseWorkSaveRequestVO payload, String actorLoginCode)
            throws Exception;

        public HaccpBaseWorkVO saveWorkTemplate(Long id, String tenantCode, HaccpBaseWorkTemplateSaveRequestVO payload,
            String actorLoginCode) throws Exception;
}
