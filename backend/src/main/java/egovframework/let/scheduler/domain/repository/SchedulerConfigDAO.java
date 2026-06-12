package egovframework.let.scheduler.domain.repository;

import egovframework.let.scheduler.domain.model.SchedulerConfig;
import egovframework.let.scheduler.domain.model.SchedulerConfigVO;
import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 스케쥴러 설정 DAO
 * @author AI Assistant
 * @since 2025.10.23
 * @version 1.0
 */
@Repository("schedulerConfigDAO")
public class SchedulerConfigDAO extends EgovAbstractMapper {

    /**
     * 스케쥴러 목록을 조회한다.
     * @param searchVO
     * @return 스케쥴러 목록
     * @throws Exception
     */
    public List<SchedulerConfigVO> selectSchedulerList(SchedulerConfigVO searchVO) throws Exception {
        return selectList("SchedulerConfigDAO.selectSchedulerList", searchVO);
    }

    /**
     * 스케쥴러 총 개수를 조회한다.
     * @param searchVO
     * @return 스케쥴러 총 개수
     * @throws Exception
     */
    public int selectSchedulerListCnt(SchedulerConfigVO searchVO) throws Exception {
        return (Integer) selectOne("SchedulerConfigDAO.selectSchedulerListCnt", searchVO);
    }

    /**
     * 스케쥴러 상세정보를 조회한다.
     * @param schedulerId
     * @return 스케쥴러 정보
     * @throws Exception
     */
    public SchedulerConfig selectSchedulerDetail(Long schedulerId) throws Exception {
        return selectOne("SchedulerConfigDAO.selectSchedulerDetail", schedulerId);
    }

    /**
     * 스케쥴러를 등록한다.
     * @param scheduler
     * @throws Exception
     */
    public void insertScheduler(SchedulerConfig scheduler) throws Exception {
        insert("SchedulerConfigDAO.insertScheduler", scheduler);
    }

    /**
     * 스케쥴러를 수정한다.
     * @param scheduler
     * @throws Exception
     */
    public void updateScheduler(SchedulerConfig scheduler) throws Exception {
        update("SchedulerConfigDAO.updateScheduler", scheduler);
    }

    /**
     * 스케쥴러를 삭제한다.
     * @param schedulerId
     * @throws Exception
     */
    public void deleteScheduler(Long schedulerId) throws Exception {
        delete("SchedulerConfigDAO.deleteScheduler", schedulerId);
    }

    /**
     * 모든 활성화된 스케쥴러를 조회한다.
     * @return 활성화된 스케쥴러 목록
     * @throws Exception
     */
    public List<SchedulerConfig> selectEnabledSchedulers() throws Exception {
        return selectList("SchedulerConfigDAO.selectEnabledSchedulers");
    }
}
