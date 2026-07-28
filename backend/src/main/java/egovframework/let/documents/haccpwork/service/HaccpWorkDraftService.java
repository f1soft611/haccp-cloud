package egovframework.let.documents.haccpwork.service;

import java.util.List;
import java.util.Map;

import egovframework.let.documents.haccpwork.domain.model.HaccpWorkVO;

/**
 * HACCP 업무 기안 조회를 위한 서비스 인터페이스 클래스
 * @author SHMT-MES
 * @since 2026.07.16
 * @version 1.0
 */
public interface HaccpWorkDraftService {

    public List<HaccpWorkVO> listMyDraftWorks(String tenantCode, String actorLoginCode) throws Exception;

    public List<HaccpWorkVO> listDocuments(
            String tenantCode,
            String actorLoginCode,
            String actorRoleCode,
            String workType,
            String workDivisionId,
            String workDivision,
            String draftNumber,
            String title,
            String writer,
            String participantType,
            String status,
            String startDate,
            String endDate
    ) throws Exception;

            public Map<String, Object> listDocumentsPaged(
                String tenantCode,
                String actorLoginCode,
                String actorRoleCode,
                String workType,
                String workDivisionId,
                String workDivision,
                String draftNumber,
                String title,
                String writer,
                String participantType,
                String status,
                String startDate,
                String endDate,
                int pageIndex,
                int pageSize
            ) throws Exception;

    public HaccpWorkVO getDraftTemplate(String tenantCode, Long id, String idType, String actorLoginCode) throws Exception;
}
