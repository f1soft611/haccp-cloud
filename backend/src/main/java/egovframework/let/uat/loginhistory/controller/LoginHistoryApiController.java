package egovframework.let.uat.loginhistory.controller;

import egovframework.com.cmm.LoginVO;
import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.let.uat.loginhistory.domain.model.LoginHistory;
import egovframework.let.uat.loginhistory.domain.model.LoginHistoryVO;
import egovframework.let.uat.loginhistory.service.LoginHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.egovframe.rte.ptl.mvc.tags.ui.pagination.PaginationInfo;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
 */
@Slf4j
@RestController
@RequestMapping("/api/loginHistory")
@Tag(name = "LoginHistoryApiController", description = "로그인 이력 관리")
public class LoginHistoryApiController {

	@Resource(name = "loginHistoryService")
	private LoginHistoryService loginHistoryService;

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
	@GetMapping("/list")
	public ResultVO selectLoginHistoryList(
			@ModelAttribute LoginHistoryVO loginHistoryVO,
			@Parameter(hidden = true) @AuthenticationPrincipal LoginVO user) throws Exception {

		ResultVO resultVO = new ResultVO();

		try {
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

			paginationInfo.setTotalRecordCount(totalCount);

			Map<String, Object> resultMap = new HashMap<>();
			resultMap.put("loginHistoryList", loginHistoryList);
			resultMap.put("paginationInfo", paginationInfo);
			resultMap.put("totalCount", totalCount);

			resultVO.setResult(resultMap);
			resultVO.setResultCode(ResponseCode.SUCCESS.getCode());
			resultVO.setResultMessage(ResponseCode.SUCCESS.getMessage());

		} catch (Exception e) {
			log.error("로그인 이력 목록 조회 실패", e);
			resultVO.setResultCode(ResponseCode.INTERNAL_SERVER_ERROR.getCode());
			resultVO.setResultMessage("로그인 이력 목록 조회에 실패했습니다: " + e.getMessage());
		}

		return resultVO;
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
	@GetMapping("/{loginHistoryId}")
	public ResultVO selectLoginHistoryDetail(
			@PathVariable Long loginHistoryId,
			@Parameter(hidden = true) @AuthenticationPrincipal LoginVO user) throws Exception {

		ResultVO resultVO = new ResultVO();

		try {
			LoginHistory loginHistory = loginHistoryService.selectLoginHistoryDetail(loginHistoryId);

			Map<String, Object> resultMap = new HashMap<>();
			resultMap.put("loginHistory", loginHistory);

			resultVO.setResult(resultMap);
			resultVO.setResultCode(ResponseCode.SUCCESS.getCode());
			resultVO.setResultMessage(ResponseCode.SUCCESS.getMessage());

		} catch (Exception e) {
			log.error("로그인 이력 상세 조회 실패", e);
			resultVO.setResultCode(ResponseCode.INTERNAL_SERVER_ERROR.getCode());
			resultVO.setResultMessage("로그인 이력 상세 조회에 실패했습니다: " + e.getMessage());
		}

		return resultVO;
	}
}
