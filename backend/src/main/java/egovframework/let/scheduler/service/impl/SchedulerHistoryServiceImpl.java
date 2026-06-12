package egovframework.let.scheduler.service.impl;

import egovframework.let.scheduler.domain.repository.SchedulerHistoryDAO;
import egovframework.let.scheduler.domain.model.SchedulerHistory;
import egovframework.let.scheduler.domain.model.SchedulerHistoryVO;
import egovframework.let.scheduler.service.SchedulerHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 스케쥴러 실행 이력 서비스 구현체
 * @author AI Assistant
 * @since 2025.10.23
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
public class SchedulerHistoryServiceImpl implements SchedulerHistoryService {

    private final SchedulerHistoryDAO schedulerHistoryDAO;

    @Override
    public Map<String, Object> selectSchedulerHistoryList(SchedulerHistoryVO searchVO) throws Exception {
        List<SchedulerHistoryVO> resultList = schedulerHistoryDAO.selectSchedulerHistoryList(searchVO);
        int totalCount = schedulerHistoryDAO.selectSchedulerHistoryListCnt(searchVO);

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("resultList", resultList);
        resultMap.put("resultCnt", String.valueOf(totalCount));

        return resultMap;
    }

    @Override
    public SchedulerHistory selectSchedulerHistoryDetail(Long historyId) throws Exception {
        return schedulerHistoryDAO.selectSchedulerHistoryDetail(historyId);
    }

    @Override
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public Long insertSchedulerHistory(SchedulerHistory history) throws Exception {
        Long historyId = schedulerHistoryDAO.insertSchedulerHistory(history);
        // MyBatis selectKey가 제대로 동작하지 않을 경우를 대비하여 명시적으로 설정
        if (history.getHistoryId() == null && historyId != null) {
            history.setHistoryId(historyId);
        }
        return history.getHistoryId();
    }

    @Override
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void updateSchedulerHistory(SchedulerHistory history) throws Exception {
        schedulerHistoryDAO.updateSchedulerHistory(history);
    }
}
