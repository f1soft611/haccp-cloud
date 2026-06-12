package egovframework.let.scheduler.service;

import egovframework.let.scheduler.domain.model.SchedulerHistory;
import egovframework.let.scheduler.domain.model.SchedulerHistoryVO;

import java.util.Map;

/**
 * 스케쥴러 실행 이력 서비스
 * @author AI Assistant
 * @since 2025.10.23
 * @version 1.0
 */
public interface SchedulerHistoryService {

    /**
     * 스케쥴러 실행 이력 목록을 조회한다.
     * @param searchVO
     * @return 실행 이력 목록
     * @throws Exception
     */
    Map<String, Object> selectSchedulerHistoryList(SchedulerHistoryVO searchVO) throws Exception;

    /**
     * 스케쥴러 실행 이력 상세정보를 조회한다.
     * @param historyId
     * @return 실행 이력 정보
     * @throws Exception
     */
    SchedulerHistory selectSchedulerHistoryDetail(Long historyId) throws Exception;

    /**
     * 스케쥴러 실행 이력을 등록한다.
     * @param history
     * @return 생성된 이력 ID
     * @throws Exception
     */
    Long insertSchedulerHistory(SchedulerHistory history) throws Exception;

    /**
     * 스케쥴러 실행 이력을 수정한다.
     * @param history
     * @throws Exception
     */
    void updateSchedulerHistory(SchedulerHistory history) throws Exception;
}
