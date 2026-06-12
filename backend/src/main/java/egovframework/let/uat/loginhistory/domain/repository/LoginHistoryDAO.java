package egovframework.let.uat.loginhistory.domain.repository;

import egovframework.let.uat.loginhistory.domain.model.LoginHistory;
import egovframework.let.uat.loginhistory.domain.model.LoginHistoryVO;
import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 로그인 이력 관리 DAO 클래스
 * @author SHMT-MES
 * @since 2026.01.08
 * @version 1.0
 * @see
 */
@Repository("loginHistoryDAO")
public class LoginHistoryDAO extends EgovAbstractMapper {

	/**
	 * 로그인 이력을 등록한다.
	 * @param loginHistory 등록할 로그인 이력 정보
	 * @return 등록 결과
	 * @throws Exception
	 */
	public int insertLoginHistory(LoginHistory loginHistory) throws Exception {
		return insert("loginHistoryDAO.insertLoginHistory", loginHistory);
	}

	/**
	 * 로그인 이력 목록을 조회한다.
	 * @param loginHistoryVO 검색 조건을 포함한 VO
	 * @return 로그인 이력 목록
	 * @throws Exception
	 */
	public List<LoginHistoryVO> selectLoginHistoryList(LoginHistoryVO loginHistoryVO) throws Exception {
		return selectList("loginHistoryDAO.selectLoginHistoryList", loginHistoryVO);
	}

	/**
	 * 로그인 이력 전체 건수를 조회한다.
	 * @param loginHistoryVO 검색 조건을 포함한 VO
	 * @return 전체 건수
	 * @throws Exception
	 */
	public int selectLoginHistoryListTotCnt(LoginHistoryVO loginHistoryVO) throws Exception {
		return selectOne("loginHistoryDAO.selectLoginHistoryListTotCnt", loginHistoryVO);
	}

	/**
	 * 로그인 이력 상세정보를 조회한다.
	 * @param loginHistoryId 로그인 이력 ID
	 * @return 로그인 이력 상세 정보
	 * @throws Exception
	 */
	public LoginHistory selectLoginHistoryDetail(Long loginHistoryId) throws Exception {
		return selectOne("loginHistoryDAO.selectLoginHistoryDetail", loginHistoryId);
	}

	/**
	 * 로그아웃 정보를 업데이트한다.
	 * @param loginHistory 업데이트할 로그인 이력 정보
	 * @return 업데이트 결과
	 * @throws Exception
	 */
	public int updateLogoutInfo(LoginHistory loginHistory) throws Exception {
		return update("loginHistoryDAO.updateLogoutInfo", loginHistory);
	}

	/**
	 * 정부 인터페이스 미전송 최신 로그인 이력 1건을 조회한다.
	 * @return 로그인 이력
	 * @throws Exception
	 */
	public LoginHistory selectLatestLoginHistoryForGovInterface() throws Exception {
		return selectOne("loginHistoryDAO.selectLatestLoginHistoryForGovInterface");
	}

	/**
	 * 정부 인터페이스 전송 대상 최신 로그인 이력 1건을 조회한다. (기간 조건 + 재시도 조건)
	 * @param fromDate 조회 시작일 (yyyy-MM-dd)
	 * @param toDate 조회 종료일 (yyyy-MM-dd)
	 * @return 로그인 이력
	 * @throws Exception
	 */
	public LoginHistory selectLatestLoginHistoryForGovInterface(String fromDate, String toDate) throws Exception {
		Map<String, String> params = new HashMap<>();
		params.put("fromDate", fromDate);
		params.put("toDate", toDate);
		return selectOne("loginHistoryDAO.selectLatestLoginHistoryForGovInterfaceByDateRange", params);
	}

	/**
	 * 정부 인터페이스 전송 결과를 업데이트한다.
	 * @param loginHistory 업데이트 정보
	 * @return 업데이트 건수
	 * @throws Exception
	 */
	public int updateGovInterfaceResult(LoginHistory loginHistory) throws Exception {
		return update("loginHistoryDAO.updateGovInterfaceResult", loginHistory);
	}
}
