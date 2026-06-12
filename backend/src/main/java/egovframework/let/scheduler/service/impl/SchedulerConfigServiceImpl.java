package egovframework.let.scheduler.service.impl;

import egovframework.let.scheduler.domain.repository.SchedulerConfigDAO;
import egovframework.let.scheduler.domain.model.SchedulerConfig;
import egovframework.let.scheduler.domain.model.SchedulerConfigVO;
import egovframework.let.scheduler.service.DynamicSchedulerService;
import egovframework.let.scheduler.service.SchedulerConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 스케쥴러 설정 관리 서비스 구현체
 * @author AI Assistant
 * @since 2025.10.23
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
public class SchedulerConfigServiceImpl implements SchedulerConfigService {

    private final SchedulerConfigDAO schedulerConfigDAO;
    private final DynamicSchedulerService dynamicSchedulerService;

    @Override
    public Map<String, Object> selectSchedulerList(SchedulerConfigVO searchVO) throws Exception {
        List<SchedulerConfigVO> resultList = schedulerConfigDAO.selectSchedulerList(searchVO);
        int totalCount = schedulerConfigDAO.selectSchedulerListCnt(searchVO);

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("resultList", resultList);
        resultMap.put("resultCnt", String.valueOf(totalCount));

        return resultMap;
    }

    @Override
    public SchedulerConfig selectSchedulerDetail(Long schedulerId) throws Exception {
        return schedulerConfigDAO.selectSchedulerDetail(schedulerId);
    }

    @Override
    @Transactional
    public void insertScheduler(SchedulerConfig scheduler) throws Exception {
        schedulerConfigDAO.insertScheduler(scheduler);
        // 스케쥴러 재시작하여 새로운 스케쥴러 적용
        dynamicSchedulerService.restartSchedulers();
    }

    @Override
    @Transactional
    public void updateScheduler(SchedulerConfig scheduler) throws Exception {
        schedulerConfigDAO.updateScheduler(scheduler);
        // 스케쥴러 재시작하여 변경사항 적용
        dynamicSchedulerService.restartSchedulers();
    }

    @Override
    @Transactional
    public void deleteScheduler(Long schedulerId) throws Exception {
        schedulerConfigDAO.deleteScheduler(schedulerId);
        // 스케쥴러 재시작하여 삭제사항 적용
        dynamicSchedulerService.restartSchedulers();
    }

    @Override
    public void restartSchedulers() throws Exception {
        dynamicSchedulerService.restartSchedulers();
    }

    @Override
    public void executeSchedulerManually(Long schedulerId, String fromDate, String toDate) throws Exception {
        dynamicSchedulerService.executeSchedulerManually(schedulerId, fromDate, toDate);
    }

    @Override
    public Map<String, Object> getSchedulerHealthStatus() throws Exception {
        Map<String, Object> healthStatus = dynamicSchedulerService.getSchedulerStatus();
        
        // DB에서 활성화된 스케줄러 수 조회
        List<SchedulerConfig> enabledSchedulers = schedulerConfigDAO.selectEnabledSchedulers();
        healthStatus.put("enabledSchedulersInDb", enabledSchedulers.size());
        
        return healthStatus;
    }
}
