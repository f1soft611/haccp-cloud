package egovframework.let.scheduler.controller;

import egovframework.com.cmm.LoginVO;
import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.com.jwt.EgovJwtTokenUtil;
import egovframework.let.scheduler.domain.model.SchedulerHistory;
import egovframework.let.scheduler.domain.model.SchedulerHistoryVO;
import egovframework.let.scheduler.service.SchedulerHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.egovframe.rte.fdl.property.EgovPropertyService;
import org.egovframe.rte.ptl.mvc.tags.ui.pagination.PaginationInfo;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 스케쥴러 실행 이력 컨트롤러
 * @author AI Assistant
 * @since 2025.10.23
 * @version 1.0
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "SchedulerHistoryApiController", description = "스케쥴러 실행 이력 관리")
@RequestMapping("/api/scheduler-history")
public class SchedulerHistoryApiController {

    public static final String HEADER_STRING = "Authorization";
    private final EgovJwtTokenUtil jwtTokenUtil;
    private final ResultVoHelper resultVoHelper;
    private final SchedulerHistoryService schedulerHistoryService;
    private final EgovPropertyService propertyService;

    /**
     * 스케쥴러 실행 이력 목록을 조회한다.
     */
    @Operation(
            summary = "스케쥴러 실행 이력 목록 조회",
            description = "스케쥴러 실행 이력 목록을 조회",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"SchedulerHistoryApiController"}
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "인가된 사용자가 아님")
    })
    @GetMapping
    public ResultVO selectSchedulerHistoryList(@ModelAttribute SchedulerHistoryVO searchVO,
                                                @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user)
            throws Exception {

        PaginationInfo paginationInfo = new PaginationInfo();
        paginationInfo.setCurrentPageNo(searchVO.getPageIndex());
        paginationInfo.setRecordCountPerPage(
                searchVO.getPageUnit() > 0 ? searchVO.getPageUnit() : propertyService.getInt("Globals.pageUnit")
        );
        paginationInfo.setPageSize(propertyService.getInt("Globals.pageSize"));

        searchVO.setFirstIndex(paginationInfo.getFirstRecordIndex());
        searchVO.setLastIndex(paginationInfo.getLastRecordIndex());
        searchVO.setRecordCountPerPage(paginationInfo.getRecordCountPerPage());

        Map<String, Object> resultMap = schedulerHistoryService.selectSchedulerHistoryList(searchVO);
        int totCnt = Integer.parseInt((String) resultMap.get("resultCnt"));
        paginationInfo.setTotalRecordCount(totCnt);
        resultMap.put("paginationInfo", paginationInfo);
        resultMap.put("user", user);

        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    /**
     * 스케쥴러 실행 이력 상세 정보를 조회한다.
     */
    @Operation(
            summary = "스케쥴러 실행 이력 상세 조회",
            description = "스케쥴러 실행 이력 상세 정보를 조회",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"SchedulerHistoryApiController"}
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "인가된 사용자가 아님"),
            @ApiResponse(responseCode = "404", description = "데이터를 찾을 수 없음")
    })
    @GetMapping("/{historyId}")
    public ResultVO selectSchedulerHistoryDetail(@Parameter(description = "이력 ID") @PathVariable Long historyId,
                                                  @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user)
            throws Exception {

        SchedulerHistory history = schedulerHistoryService.selectSchedulerHistoryDetail(historyId);
        if (history == null) {
            return resultVoHelper.buildFromMap(new HashMap<>(), ResponseCode.INPUT_CHECK_ERROR);
        }

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("history", history);
        resultMap.put("user", user);

        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }
}
