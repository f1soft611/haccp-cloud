package egovframework.let.scheduler.service;

import egovframework.let.scheduler.domain.model.SchedulerConfig;
import egovframework.let.scheduler.domain.model.SchedulerConfigVO;

import java.util.Map;

/**
 * 스케쥴러 설정 관리 서비스
 * @author AI Assistant
 * @since 2025.10.23
 * @version 1.0
 */
public interface SchedulerConfigService {

    /**
     * 스케쥴러 목록을 조회한다.
     * @param searchVO
     * @return 스케쥴러 목록
     * @throws Exception
     */
    Map<String, Object> selectSchedulerList(SchedulerConfigVO searchVO) throws Exception;

    /**
     * 스케쥴러 상세정보를 조회한다.
     * @param schedulerId
     * @return 스케쥴러 정보
     * @throws Exception
     */
    SchedulerConfig selectSchedulerDetail(Long schedulerId) throws Exception;

    /**
     * 스케쥴러를 등록한다.
     * @param scheduler
     * @throws Exception
     */
    void insertScheduler(SchedulerConfig scheduler) throws Exception;

    /**
     * 스케쥴러를 수정한다.
     * @param scheduler
     * @throws Exception
     */
    void updateScheduler(SchedulerConfig scheduler) throws Exception;

    /**
     * 스케쥴러를 삭제한다.
     * @param schedulerId
     * @throws Exception
     */
    void deleteScheduler(Long schedulerId) throws Exception;

    /**
     * 스케쥴러를 재시작한다.
     * @throws Exception
     */
    void restartSchedulers() throws Exception;

    /**
     * 특정 스케쥴러를 즉시 실행한다.
     * @param schedulerId 스케쥴러 ID
     * @param fromDate 조회 시작 날짜 (yyyy-MM-dd), null이면 오늘 날짜 사용
     * @param toDate 조회 종료 날짜 (yyyy-MM-dd), null이면 오늘 날짜 사용
     * @throws Exception
     */
    void executeSchedulerManually(Long schedulerId, String fromDate, String toDate) throws Exception;

    /**
     * 스케쥴러 시스템의 상태를 확인한다.
     * @return 스케쥴러 상태 정보 (초기화 여부, 활성 작업 수 등)
     * @throws Exception
     */
    Map<String, Object> getSchedulerHealthStatus() throws Exception;
}
