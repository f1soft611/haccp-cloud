package egovframework.let.scheduler.domain.repository;

import egovframework.let.scheduler.domain.model.SchedulerHistory;
import egovframework.let.scheduler.domain.model.SchedulerHistoryVO;
import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 스케쥴러 실행 이력 DAO
 * @author AI Assistant
 * @since 2025.10.23
 * @version 1.0
 */
@Repository("schedulerHistoryDAO")
public class SchedulerHistoryDAO extends EgovAbstractMapper {

    /**
     * 스케쥴러 실행 이력 목록을 조회한다.
     * @param searchVO
     * @return 실행 이력 목록
     * @throws Exception
     */
    public List<SchedulerHistoryVO> selectSchedulerHistoryList(SchedulerHistoryVO searchVO) throws Exception {
        return selectList("SchedulerHistoryDAO.selectSchedulerHistoryList", searchVO);
    }

    /**
     * 스케쥴러 실행 이력 총 개수를 조회한다.
     * @param searchVO
     * @return 실행 이력 총 개수
     * @throws Exception
     */
    public int selectSchedulerHistoryListCnt(SchedulerHistoryVO searchVO) throws Exception {
        return (Integer) selectOne("SchedulerHistoryDAO.selectSchedulerHistoryListCnt", searchVO);
    }

    /**
     * 스케쥴러 실행 이력 상세정보를 조회한다.
     * @param historyId
     * @return 실행 이력 정보
     * @throws Exception
     */
    public SchedulerHistory selectSchedulerHistoryDetail(Long historyId) throws Exception {
        return selectOne("SchedulerHistoryDAO.selectSchedulerHistoryDetail", historyId);
    }

    /**
     * 스케쥴러 실행 이력을 등록한다.
     * @param history
     * @return 생성된 이력 ID
     * @throws Exception
     */
    public Long insertSchedulerHistory(SchedulerHistory history) throws Exception {
        insert("SchedulerHistoryDAO.insertSchedulerHistory", history);
        return history.getHistoryId();
    }

    /**
     * 스케쥴러 실행 이력을 수정한다.
     * @param history
     * @throws Exception
     */
    public void updateSchedulerHistory(SchedulerHistory history) throws Exception {
        update("SchedulerHistoryDAO.updateSchedulerHistory", history);
    }
}
