package egovframework.let.uat.uia.service.impl;

import egovframework.com.cmm.LoginVO;
import egovframework.let.platforms.tenants.domain.model.TenantVO;
import egovframework.let.platforms.tenants.domain.repository.TenantInfoDAO;
import egovframework.let.platforms.tenants.context.TenantContextHolder;
import egovframework.let.uat.uia.service.EgovLoginService;
import egovframework.let.utl.fcc.service.EgovNumberUtil;
import egovframework.let.utl.fcc.service.EgovStringUtil;
import egovframework.let.utl.sim.service.EgovFileScrty;

import org.egovframe.rte.fdl.cmmn.EgovAbstractServiceImpl;

import javax.annotation.Resource;

import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

/**
 * 일반 로그인을 처리하는 비즈니스 구현 클래스
 * @author 공통서비스 개발팀 박지욱
 * @since 2009.03.06
 * @version 1.0
 * @see
 *
 * <pre>
 * << 개정이력(Modification Information) >>
 *
 *   수정일      수정자          수정내용
 *  -------    --------    ---------------------------
 *  2009.03.06  박지욱          최초 생성
 *  2011.08.31  JJY            경량환경 템플릿 커스터마이징버전 생성
 *  2026.06.23  AI             다중 테넌트 지원 - TenantContextHolder 통합
 *
 *  </pre>
 */
@Slf4j
@Service("loginService")
public class EgovLoginServiceImpl extends EgovAbstractServiceImpl implements EgovLoginService {

	@Resource(name = "loginDAO")
	private LoginDAO loginDAO;

	@Resource(name = "tenantInfoDAO")
	private TenantInfoDAO tenantInfoDAO;

	/**
	 * 일반 로그인을 처리한다
	 * @param vo LoginVO
	 * @return LoginVO
	 * @exception Exception
	 */
	@Override
	public LoginVO actionLogin(LoginVO vo) throws Exception {
		if (vo.getId() != null) {
			vo.getId().trim();
		}

		// 1. TenantContextHolder에서 tenantId 추출
		Long tenantId = TenantContextHolder.getTenantId();
		if (tenantId == null && isPlatformAdminLogin(vo)) {
			tenantId = resolveTenantIdByTenantCode(vo.getTenantCode());
		} else if (tenantId == null) {
			tenantId = resolveTenantIdByLoginIdDomain(vo.getId());
		}
		if (tenantId == null) {
			log.warn("TenantContextHolder: tenantId is null. login attempt by id={}", vo.getId());
			throw new IllegalStateException("도메인을 포함한 로그인 ID로 접속해주세요.");
		}
		vo.setTenantId(tenantId);

		// 2. 입력한 비밀번호를 암호화한다.
		String enpassword = EgovFileScrty.encryptPassword(vo.getPassword(), vo.getId());
		vo.setPassword(enpassword);

		// 3. 아이디와 암호화된 비밀번호가 DB와 일치하는지 확인한다.
		LoginVO loginVO = loginDAO.actionLogin(vo);

		// 4. 결과를 리턴한다.
		if (loginVO != null && !loginVO.getId().equals("") && !loginVO.getPassword().equals("")) {
			log.info("Login successful: userId={}, tenantId={}", loginVO.getId(), tenantId);
			return loginVO;
		} else {
			loginVO = new LoginVO();
			log.warn("Login failed: userId={}, tenantId={}", vo.getId(), tenantId);
		}

		return loginVO;
	}

	private boolean isPlatformAdminLogin(LoginVO vo) {
		return vo != null && "PLATFORM_ADMIN".equals(vo.getRoleCode());
	}

	private Long resolveTenantIdByTenantCode(String tenantCode) {
		if (tenantCode == null || tenantCode.trim().isEmpty()) {
			return null;
		}

		return tenantInfoDAO.selectTenantIdByCode(tenantCode.trim());
	}

	private Long resolveTenantIdByLoginIdDomain(String loginId) {
		if (loginId == null) {
			return null;
		}

		int atIndex = loginId.indexOf('@');
		if (atIndex < 0 || atIndex == loginId.length() - 1) {
			return null;
		}

		String domain = loginId.substring(atIndex + 1).trim();
		if (domain.isEmpty()) {
			return null;
		}

		TenantVO tenant = tenantInfoDAO.selectByAdminEmailDomain(domain);
		return tenant != null ? tenant.getTenantId() : null;
	}

	/**
	 * 아이디를 찾는다.
	 * @param vo LoginVO
	 * @return LoginVO
	 * @exception Exception
	 */
	@Override
	public LoginVO searchId(LoginVO vo) throws Exception {

		// 1. 이름, 이메일주소가 DB와 일치하는 사용자 ID를 조회한다.
		LoginVO loginVO = loginDAO.searchId(vo);

		// 2. 결과를 리턴한다.
		if (loginVO != null && !loginVO.getId().equals("")) {
			return loginVO;
		} else {
			loginVO = new LoginVO();
		}

		return loginVO;
	}

	/**
	 * 비밀번호를 찾는다.
	 * @param vo LoginVO
	 * @return boolean
	 * @exception Exception
	 */
	@Override
	public boolean searchPassword(LoginVO vo) throws Exception {

		boolean result = true;

		// 1. 아이디, 이름, 이메일주소, 비밀번호 힌트, 비밀번호 정답이 DB와 일치하는 사용자 Password를 조회한다.
		LoginVO loginVO = loginDAO.searchPassword(vo);
		if (loginVO == null || loginVO.getPassword() == null || loginVO.getPassword().equals("")) {
			return false;
		}

		// 2. 임시 비밀번호를 생성한다.(영+영+숫+영+영+숫=6자리)
		String newpassword = "";
		for (int i = 1; i <= 6; i++) {
			// 영자
			if (i % 3 != 0) {
				newpassword += EgovStringUtil.getRandomStr('a', 'z');
				// 숫자
			} else {
				newpassword += EgovNumberUtil.getRandomNum(0, 9);
			}
		}

		// 3. 임시 비밀번호를 암호화하여 DB에 저장한다.
		LoginVO pwVO = new LoginVO();
		String enpassword = EgovFileScrty.encryptPassword(newpassword, vo.getId());
		pwVO.setId(vo.getId());
		pwVO.setPassword(enpassword);
		pwVO.setUserSe(vo.getUserSe());
		loginDAO.updatePassword(pwVO);

		return result;
	}
}