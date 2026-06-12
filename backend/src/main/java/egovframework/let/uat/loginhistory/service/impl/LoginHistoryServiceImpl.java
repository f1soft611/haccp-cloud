package egovframework.let.uat.loginhistory.service.impl;

import egovframework.let.uat.loginhistory.domain.model.LoginHistory;
import egovframework.let.uat.loginhistory.domain.model.LoginHistoryVO;
import egovframework.let.uat.loginhistory.domain.repository.LoginHistoryDAO;
import egovframework.let.uat.loginhistory.service.LoginHistoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.List;

/**
 * 로그인 이력 관리 서비스 구현 클래스
 * @author SHMT-MES
 * @since 2026.01.08
 * @version 1.0
 * @see
 */
@Slf4j
@Service("loginHistoryService")
public class LoginHistoryServiceImpl implements LoginHistoryService {

	@Resource(name = "loginHistoryDAO")
	private LoginHistoryDAO loginHistoryDAO;

	/**
	 * 로그인 이력을 등록한다.
	 */
	@Override
	public int insertLoginHistory(LoginHistory loginHistory) throws Exception {
		return loginHistoryDAO.insertLoginHistory(loginHistory);
	}

	/**
	 * 로그인 이력 목록을 조회한다.
	 */
	@Override
	public List<LoginHistoryVO> selectLoginHistoryList(LoginHistoryVO loginHistoryVO) throws Exception {
		return loginHistoryDAO.selectLoginHistoryList(loginHistoryVO);
	}

	/**
	 * 로그인 이력 전체 건수를 조회한다.
	 */
	@Override
	public int selectLoginHistoryListTotCnt(LoginHistoryVO loginHistoryVO) throws Exception {
		return loginHistoryDAO.selectLoginHistoryListTotCnt(loginHistoryVO);
	}

	/**
	 * 로그인 이력 상세정보를 조회한다.
	 */
	@Override
	public LoginHistory selectLoginHistoryDetail(Long loginHistoryId) throws Exception {
		return loginHistoryDAO.selectLoginHistoryDetail(loginHistoryId);
	}

	/**
	 * 로그아웃 정보를 업데이트한다.
	 */
	@Override
	public int updateLogoutInfo(Long loginHistoryId) throws Exception {
		LoginHistory loginHistory = new LoginHistory();
		loginHistory.setLoginHistoryId(loginHistoryId);
		return loginHistoryDAO.updateLogoutInfo(loginHistory);
	}

	@Override
	public LoginHistory selectLatestLoginHistoryForGovInterface() throws Exception {
		return loginHistoryDAO.selectLatestLoginHistoryForGovInterface();
	}

	@Override
	public LoginHistory selectLatestLoginHistoryForGovInterface(String fromDate, String toDate) throws Exception {
		return loginHistoryDAO.selectLatestLoginHistoryForGovInterface(fromDate, toDate);
	}

	@Override
	public int updateGovInterfaceResult(LoginHistory loginHistory) throws Exception {
		return loginHistoryDAO.updateGovInterfaceResult(loginHistory);
	}
}
