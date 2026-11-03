package egovframework.let.basicinfo.workday.domain.repository;

import java.util.List;
import java.util.Map;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.basicinfo.workday.domain.model.WorkdayVO;

/**
 * 업무일 관리를 위한 데이터 접근 클래스
 * @author SHMT-MES
 * @since 2026.11.03
 * @version 1.0
 */
@Repository("workdayDAO")
public class WorkdayDAO extends EgovAbstractMapper {

    public List<WorkdayVO> selectWorkdayList(Map<String, Object> params) throws Exception {
        return selectList("WorkdayDAO.selectWorkdayList", params);
    }

    public int selectWorkdayCount(Map<String, Object> params) throws Exception {
        Integer count = selectOne("WorkdayDAO.selectWorkdayCount", params);
        return count == null ? 0 : count;
    }

    public int updateWorkday(Map<String, Object> params) throws Exception {
        return update("WorkdayDAO.updateWorkday", params);
    }

    public void upsertGeneratedWorkday(Map<String, Object> params) throws Exception {
        insert("WorkdayDAO.upsertGeneratedWorkday", params);
    }

    public Long selectTenantIdByCode(String tenantCode) throws Exception {
        return selectOne("WorkdayDAO.selectTenantIdByCode", tenantCode);
    }

    public Long selectUserIdByLoginCode(Map<String, Object> params) throws Exception {
        return selectOne("WorkdayDAO.selectUserIdByLoginCode", params);
    }
}