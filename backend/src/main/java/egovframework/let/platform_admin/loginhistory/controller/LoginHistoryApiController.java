package egovframework.let.platform_admin.loginhistory.controller;

import egovframework.com.cmm.LoginVO;
import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.let.platform_admin.access.web.PlanAccessLevel;
import egovframework.let.platform_admin.access.web.PlanAccessPolicy;
import egovframework.let.platform_admin.loginhistory.domain.model.LoginHistory;
import egovframework.let.platform_admin.loginhistory.domain.model.LoginHistoryVO;
import egovframework.let.platform_admin.loginhistory.service.LoginHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.egovframe.rte.ptl.mvc.tags.ui.pagination.PaginationInfo;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 로그인 이력 관리 컨트롤러
 * @author SHMT-MES
 * @since 2026.01.08
 * @version 1.0
 * @see
 *
 * <pre>
 * << 개정이력(Modification Information) >>
 *
 *   수정일      수정자           수정내용
 *  -------    --------    ---------------------------
 *   2026.01.08 SHMT-MES          최초 생성
 *
 * </pre>
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/platform-admin/login-history")
@Tag(name = "LoginHistoryApiController", description = "로그인 이력 관리")
public class LoginHistoryApiController {

	@Resource(name = "loginHistoryService")
	private LoginHistoryService loginHistoryService;

	@Resource(name = "resultVoHelper")
	private ResultVoHelper resultVoHelper;

	/**
	 * 로그인 이력 목록을 조회한다.
	 */
	@Operation(
			summary = "로그인 이력 목록 조회",
			description = "로그인 이력 목록을 조회합니다",
			security = {@SecurityRequirement(name = "Authorization")},
			tags = {"LoginHistoryApiController"}
	)
	@ApiResponses(value = {
			@ApiResponse(responseCode = "200", description = "조회 성공")
	})
	@PlanAccessPolicy(
			menuUrl = "/platform/login-history",
			featureCode = "FEATURE_AUDIT_LOG",
			requiredPermissionLevel = PlanAccessLevel.READ
	)
	@GetMapping({"", "/list"})
	public ResultVO selectLoginHistoryList(
			@ModelAttribute LoginHistoryVO loginHistoryVO,
			@Parameter(hidden = true) @AuthenticationPrincipal LoginVO user) throws Exception {

		try {
			boolean isPlatformAdmin = user != null
					&& StringUtils.hasText(user.getRoleCode())
					&& "PLATFORM_ADMIN".equalsIgnoreCase(user.getRoleCode());

			if (!isPlatformAdmin
					&& !StringUtils.hasText(loginHistoryVO.getTenantCode())
					&& user != null
					&& StringUtils.hasText(user.getTenantCode())) {
				loginHistoryVO.setTenantCode(user.getTenantCode());
			}

			log.debug(
					"로그인 이력 조회 조건 - roleCode: {}, tenantCode: {}, searchUserId: {}, searchUserName: {}, searchLoginResult: {}, searchStartDt: {}, searchEndDt: {}",
					user != null ? user.getRoleCode() : null,
					loginHistoryVO.getTenantCode(),
					loginHistoryVO.getSearchUserId(),
					loginHistoryVO.getSearchUserName(),
					loginHistoryVO.getSearchLoginResult(),
					loginHistoryVO.getSearchStartDt(),
					loginHistoryVO.getSearchEndDt());

			// 페이징 설정
			PaginationInfo paginationInfo = new PaginationInfo();
			paginationInfo.setCurrentPageNo(loginHistoryVO.getPageIndex());
			paginationInfo.setRecordCountPerPage(loginHistoryVO.getPageSize());
			paginationInfo.setPageSize(loginHistoryVO.getPageUnit());

			loginHistoryVO.setFirstIndex(paginationInfo.getFirstRecordIndex());
			loginHistoryVO.setLastIndex(paginationInfo.getLastRecordIndex());
			loginHistoryVO.setRecordCountPerPage(paginationInfo.getRecordCountPerPage());

			// 목록 조회
			List<LoginHistoryVO> loginHistoryList = loginHistoryService.selectLoginHistoryList(loginHistoryVO);
			int totalCount = loginHistoryService.selectLoginHistoryListTotCnt(loginHistoryVO);

			log.debug("로그인 이력 조회 결과 건수 - totalCount: {}", totalCount);

			paginationInfo.setTotalRecordCount(totalCount);

			Map<String, Object> dataMap = new HashMap<>();
			dataMap.put("loginHistoryList", loginHistoryList);
			dataMap.put("paginationInfo", paginationInfo);
			dataMap.put("totalCount", totalCount);

			Map<String, Object> resultMap = new HashMap<>();
			resultMap.put("data", dataMap);
			return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);

		} catch (Exception e) {
			log.error("로그인 이력 목록 조회 실패", e);
			Map<String, Object> errorMap = new HashMap<>();
			errorMap.put("errorCode", "LOGIN_HISTORY_LIST_FETCH_FAILED");
			errorMap.put("errorMessage", "로그인 이력 목록 조회에 실패했습니다.");
			return resultVoHelper.buildFromMap(errorMap, ResponseCode.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * 로그인 이력 상세정보를 조회한다.
	 */
	@Operation(
			summary = "로그인 이력 상세 조회",
			description = "로그인 이력 상세정보를 조회합니다",
			security = {@SecurityRequirement(name = "Authorization")},
			tags = {"LoginHistoryApiController"}
	)
	@ApiResponses(value = {
			@ApiResponse(responseCode = "200", description = "조회 성공")
	})
	@PlanAccessPolicy(
			menuUrl = "/platform/login-history",
			featureCode = "FEATURE_AUDIT_LOG",
			requiredPermissionLevel = PlanAccessLevel.READ
	)
	@GetMapping("/{loginHistoryId:\\d+}")
	public ResultVO selectLoginHistoryDetail(
			@PathVariable Long loginHistoryId,
			@Parameter(hidden = true) @AuthenticationPrincipal LoginVO user) throws Exception {

		try {
			LoginHistory loginHistory = loginHistoryService.selectLoginHistoryDetail(loginHistoryId);

			Map<String, Object> dataMap = new HashMap<>();
			dataMap.put("loginHistory", loginHistory);

			Map<String, Object> resultMap = new HashMap<>();
			resultMap.put("data", dataMap);
			return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);

		} catch (Exception e) {
			log.error("로그인 이력 상세 조회 실패", e);
			Map<String, Object> errorMap = new HashMap<>();
			errorMap.put("errorCode", "LOGIN_HISTORY_DETAIL_FETCH_FAILED");
			errorMap.put("errorMessage", "로그인 이력 상세 조회에 실패했습니다.");
			return resultVoHelper.buildFromMap(errorMap, ResponseCode.INTERNAL_SERVER_ERROR);
		}
	}
}
