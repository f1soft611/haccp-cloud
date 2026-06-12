package egovframework.let.uat.uia.web;

import java.util.HashMap;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.egovframe.rte.fdl.cmmn.trace.LeaveaTrace;
import org.egovframe.rte.fdl.property.EgovPropertyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import egovframework.com.cmm.EgovMessageSource;
import egovframework.com.cmm.LoginVO;
import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.jwt.EgovJwtTokenUtil;
import egovframework.let.uat.uia.service.EgovLoginService;
import egovframework.let.uat.loginhistory.domain.model.LoginHistory;
import egovframework.let.uat.loginhistory.service.LoginHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;

/**
 * 일반 로그인을 처리하는 컨트롤러 클래스
 * @author 공통서비스 개발팀 박지욱
 * @since 2009.03.06
 * @version 1.0
 * @see
 *
 * <pre>
 * << 개정이력(Modification Information) >>
 *
 *  수정일      수정자      수정내용
 *  -------            --------        ---------------------------
 *  2009.03.06  박지욱     최초 생성
 *  2011.08.31  JJY            경량환경 템플릿 커스터마이징버전 생성
 *
 *  </pre>
 */
@Slf4j
@RestController
@Tag(name="EgovLoginApiController",description = "로그인 관련")
public class EgovLoginApiController {

	/** EgovLoginService */
	@Resource(name = "loginService")
	private EgovLoginService loginService;

	/** EgovMessageSource */
	@Resource(name = "egovMessageSource")
	EgovMessageSource egovMessageSource;

	/** EgovPropertyService */
	@Resource(name = "propertiesService")
	protected EgovPropertyService propertiesService;

	/** TRACE */
	@Resource(name = "leaveaTrace")
	LeaveaTrace leaveaTrace;
	
	/** JWT */
	@Autowired
    private EgovJwtTokenUtil jwtTokenUtil;

	/** LoginHistoryService */
	@Resource(name = "loginHistoryService")
	private LoginHistoryService loginHistoryService;

	/**
	 * 일반 로그인을 처리한다
	 * @param vo - 아이디, 비밀번호가 담긴 LoginVO
	 * @param request - 세션처리를 위한 HttpServletRequest
	 * @return result - 로그인결과(세션정보)
	 * @exception Exception
	 */

	@Operation(
			summary = "일반 로그인",
			description = "일반 로그인 처리",
			tags = {"EgovLoginApiController"}
	)
	@ApiResponses(value = {
			@ApiResponse(responseCode = "200", description = "로그인 성공"),
			@ApiResponse(responseCode = "300", description = "로그인 실패")
	})
	@PostMapping(value = "/auth/login", consumes = {MediaType.APPLICATION_JSON_VALUE , MediaType.TEXT_HTML_VALUE})
	public HashMap<String, Object> actionLogin(@RequestBody LoginVO loginVO, HttpServletRequest request) throws Exception {
		HashMap<String,Object> resultMap = new HashMap<String,Object>();

		// 로그인 이력 저장을 위한 정보 수집
		String clientIp = getClientIp(request);
		String userAgent = request.getHeader("User-Agent");

		// 1. 일반 로그인 처리
		LoginVO loginResultVO = loginService.actionLogin(loginVO);

		// 로그인 이력 엔티티 생성
		LoginHistory loginHistory = new LoginHistory();
		loginHistory.setUserId(loginVO.getId());
		loginHistory.setLoginIp(clientIp);
		loginHistory.setLoginType("SESSION");
		loginHistory.setUserAgent(userAgent);

		if (loginResultVO != null && loginResultVO.getId() != null && !"".equals(loginResultVO.getId())) {
			if ("ROLE_ADMIN".equals(loginResultVO.getGroupNm())) {
				loginResultVO.setUserSe("ADM");
			}

			loginHistory.setUserName(loginResultVO.getName());
			loginHistory.setLoginResult("Y");

			request.getSession().setAttribute("LoginVO", loginResultVO);
			resultMap.put("resultVO", loginResultVO);
			resultMap.put("resultCode", "200");
			resultMap.put("resultMessage", "성공 !!!");
		} else {
			loginHistory.setLoginResult("N");
			loginHistory.setFailReason("아이디 또는 비밀번호가 일치하지 않습니다");

			resultMap.put("resultVO", loginResultVO);
			resultMap.put("resultCode", "300");
			resultMap.put("resultMessage", egovMessageSource.getMessage("fail.common.login"));
		}

		// 로그인 이렵 저장
		try {
			int result = loginHistoryService.insertLoginHistory(loginHistory);
			
			if (loginHistory.getLoginHistoryId() != null) {
				request.getSession().setAttribute("loginHistoryId", loginHistory.getLoginHistoryId());
				// 응답에도 loginHistoryId 포함 (JWT 방식 로그아웃을 위해)
				resultMap.put("loginHistoryId", loginHistory.getLoginHistoryId());
			}
			log.info("로그인 이력 저장 완료 - userId: {}, result: {}, loginHistoryId: {}",
				loginHistory.getUserId(), result, loginHistory.getLoginHistoryId());
		} catch (Exception e) {
			log.error("로그인 이력 저장 실패 - userId: {}", loginHistory.getUserId(), e);
		}

		return resultMap;

	}

	@Operation(
			summary = "JWT 로그인",
			description = "JWT 로그인 처리",
			tags = {"EgovLoginApiController"}
	)
	@ApiResponses(value = {
			@ApiResponse(responseCode = "200", description = "로그인 성공"),
			@ApiResponse(responseCode = "300", description = "로그인 실패")
	})
	@PostMapping(value = "/auth/login-jwt")
	public HashMap<String, Object> actionLoginJWT(@RequestBody LoginVO loginVO, HttpServletRequest request, ModelMap model) throws Exception {
		HashMap<String, Object> resultMap = new HashMap<String, Object>();

		// 로그인 이력 저장을 위한 정보 수집
		String clientIp = getClientIp(request);
		String userAgent = request.getHeader("User-Agent");

		// 1. JWT 로그인 처리
		LoginVO loginResultVO = loginService.actionLogin(loginVO);

		// 2. 로그인 이력 저장
		LoginHistory loginHistory = new LoginHistory();
		loginHistory.setUserId(loginVO.getId());
		loginHistory.setLoginIp(clientIp);
		loginHistory.setLoginType("JWT");
		loginHistory.setUserAgent(userAgent);
		
		if (loginResultVO != null && loginResultVO.getId() != null && !loginResultVO.getId().equals("")) {
			if(loginResultVO.getGroupNm().equals("ROLE_ADMIN")) {//로그인 결과에서 스프링시큐리티용 그룹명값에 따른 권한부여
				loginResultVO.setUserSe("ADM");
	        }
			log.debug("===>>> loginResultVO.getUserSe() = "+loginResultVO.getUserSe());
			log.debug("===>>> loginResultVO.getId() = "+loginResultVO.getId());
			log.debug("===>>> loginResultVO.getPassword() = "+loginResultVO.getPassword());
			log.debug("===>>> loginResultVO.getGroupNm() = "+loginResultVO.getGroupNm());//로그인 결과에서 스프링시큐리티용 그룹명값 출력
			
			String jwtToken = jwtTokenUtil.generateToken(loginResultVO);
			String refreshToken = jwtTokenUtil.generateRefreshToken(loginResultVO);
			
			String username = jwtTokenUtil.getUserSeFromToken(jwtToken);
	    	log.debug("Dec jwtToken username = "+username);
	    	String groupnm = jwtTokenUtil.getInfoFromToken("groupNm", jwtToken);
	    	log.debug("Dec jwtToken groupnm = "+groupnm);//생성한 토큰에서 스프링시큐리티용 그룹명값 출력
	    	//서버사이드 권한 체크 통과를 위해 삽입
	    	//EgovUserDetailsHelper.isAuthenticated() 가 그 역할 수행. DB에 정보가 없으면 403을 돌려 줌. 로그인으로 튕기는 건 프론트 쪽에서 처리
	    	request.getSession().setAttribute("LoginVO", loginResultVO);
	    	
			loginHistory.setUserName(loginResultVO.getName());
			loginHistory.setLoginResult("Y");
	    	
			resultMap.put("resultVO", loginResultVO);
			resultMap.put("jToken", jwtToken);
			resultMap.put("refreshToken", refreshToken);
			resultMap.put("resultCode", "200");
			resultMap.put("resultMessage", "성공 !!!");
			
		} else {
			loginHistory.setLoginResult("N");
			loginHistory.setFailReason("아이디 또는 비밀번호가 일치하지 않습니다");
			
			resultMap.put("resultVO", loginResultVO);
			resultMap.put("resultCode", "300");
			resultMap.put("resultMessage", egovMessageSource.getMessage("fail.common.login"));
		}

		// 로그인 이력 저장
		try {
			int result = loginHistoryService.insertLoginHistory(loginHistory);
			
			if (loginHistory.getLoginHistoryId() != null) {
				request.getSession().setAttribute("loginHistoryId", loginHistory.getLoginHistoryId());
				// 응답에도 loginHistoryId 포함 (JWT 방식 로그아웃을 위해)
				resultMap.put("loginHistoryId", loginHistory.getLoginHistoryId());
			}
			log.info("로그인 이력 저장 완료 - userId: {}, result: {}, loginHistoryId: {}",
				loginHistory.getUserId(), result, loginHistory.getLoginHistoryId());
		} catch (Exception e) {
			log.error("로그인 이력 저장 실패 - userId: {}", loginHistory.getUserId(), e);
		}
		
		return resultMap;
	}

	@Operation(
			summary = "JWT 토큰 리프레쉬",
			description = "리프레쉬 토큰을 사용하여 새로운 액세스 토큰을 발급받습니다",
			tags = {"EgovLoginApiController"}
	)
	@ApiResponses(value = {
			@ApiResponse(responseCode = "200", description = "토큰 리프레쉬 성공"),
			@ApiResponse(responseCode = "401", description = "리프레쉬 토큰이 유효하지 않음")
	})
	@PostMapping(value = "/auth/refresh")
	public HashMap<String, Object> refreshToken(@RequestBody HashMap<String, String> request) {
		HashMap<String, Object> resultMap = new HashMap<>();

		String refreshToken = request.get("refreshToken");

		if (refreshToken == null || refreshToken.trim().isEmpty()) {
			resultMap.put("resultCode", "401");
			resultMap.put("resultMessage", "리프레쉬 토큰이 제공되지 않았습니다");
			return resultMap;
		}

		if (!jwtTokenUtil.isValidRefreshToken(refreshToken)) {
			resultMap.put("resultCode", "401");
			resultMap.put("resultMessage", "유효하지 않은 리프레쉬 토큰입니다");
			return resultMap;
		}

		try {
			LoginVO loginVO = jwtTokenUtil.getLoginVOFromToken(refreshToken);

			if (loginVO == null) {
				resultMap.put("resultCode", "401");
				resultMap.put("resultMessage", "토큰에서 사용자 정보를 추출할 수 없습니다");
				return resultMap;
			}

			String newAccessToken = jwtTokenUtil.generateToken(loginVO);

			resultMap.put("jToken", newAccessToken);
			resultMap.put("resultCode", "200");
			resultMap.put("resultMessage", "토큰 리프레쉬 성공");

		} catch (Exception e) {
			log.error("토큰 리프레쉬 실패: " + e.getMessage(), e);
			resultMap.put("resultCode", "500");
			resultMap.put("resultMessage", "토큰 리프레쉬 실패");
		}

		return resultMap;
	}

	/**
	 * 로그아웃한다.
	 * @return resultVO
	 * @exception Exception
	 */
	@Operation(
			summary = "로그아웃",
			description = "로그아웃 처리(JWT,일반 관계 없이)",
			security = {@SecurityRequirement(name = "Authorization")},
			tags = {"EgovLoginApiController"}
	)
	@ApiResponses(value = {
			@ApiResponse(responseCode = "200", description = "로그아웃 성공"),
	})
	@PostMapping(value = "/auth/logout")
	public ResultVO actionLogoutJSON(@RequestBody(required = false) HashMap<String, Object> params, 
									  HttpServletRequest request, HttpServletResponse response) throws Exception {

		ResultVO resultVO = new ResultVO();

		log.info("=== 로그아웃 시작 ===");
		
		Long loginHistoryId = null;
		
		// 1. 요청 파라미터에서 loginHistoryId 확인 (JWT 방식)
		if (params != null && params.containsKey("loginHistoryId")) {
			Object idObj = params.get("loginHistoryId");
			if (idObj instanceof Number) {
				loginHistoryId = ((Number) idObj).longValue();
				log.debug("파라미터에서 loginHistoryId 가져옴: {}", loginHistoryId);
			}
		}
		
		// 2. 세션에서 loginHistoryId 확인 (일반 로그인 방식)
		if (loginHistoryId == null) {
			Object historyIdObj = request.getSession().getAttribute("loginHistoryId");
			
			if (historyIdObj != null) {
				try {
					if (historyIdObj instanceof Long) {
						loginHistoryId = (Long) historyIdObj;
					} else if (historyIdObj instanceof Integer) {
						loginHistoryId = ((Integer) historyIdObj).longValue();
					} else if (historyIdObj instanceof Number) {
						loginHistoryId = ((Number) historyIdObj).longValue();
					}
					log.debug("세션에서 변환된 loginHistoryId: {}", loginHistoryId);
				} catch (Exception e) {
					log.error("loginHistoryId 변환 실패", e);
				}
			}
		}
		
		// 로그아웃 이력 업데이트
		if (loginHistoryId != null) {
			try {
				log.info("로그아웃 이력 업데이트 시작 - loginHistoryId: {}", loginHistoryId);
				int updateResult = loginHistoryService.updateLogoutInfo(loginHistoryId);
				log.info("로그아웃 이력 업데이트 완료 - loginHistoryId: {}, updateResult: {}", loginHistoryId, updateResult);
			} catch (Exception e) {
				log.error("로그아웃 이력 업데이트 실패 - loginHistoryId: {}", loginHistoryId, e);
			}
		} else {
			log.warn("loginHistoryId를 찾을 수 없습니다. 로그아웃 이력 업데이트를 건너뜁니다.");
		}

		// 시큐리티 로그아웃 수행 (세션/컨텍스트 초기화)
		new SecurityContextLogoutHandler().logout(request, response, null);

		resultVO.setResultCode(ResponseCode.SUCCESS.getCode());
		resultVO.setResultMessage(ResponseCode.SUCCESS.getMessage());

		return resultVO;
	}

	/**
	 * 클라이언트 IP를 가져온다.
	 * @param request
	 * @return clientIp
	 */
	private String getClientIp(HttpServletRequest request) {
		String ip = request.getHeader("X-Forwarded-For");
		if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
			ip = request.getHeader("Proxy-Client-IP");
		}
		if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
			ip = request.getHeader("WL-Proxy-Client-IP");
		}
		if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
			ip = request.getHeader("HTTP_CLIENT_IP");
		}
		if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
			ip = request.getHeader("HTTP_X_FORWARDED_FOR");
		}
		if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
			ip = request.getRemoteAddr();
		}
		return ip;
	}
}