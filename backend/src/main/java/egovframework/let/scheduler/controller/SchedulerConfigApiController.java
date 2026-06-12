package egovframework.let.scheduler.controller;

import egovframework.com.cmm.LoginVO;
import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.com.jwt.EgovJwtTokenUtil;
import egovframework.let.scheduler.domain.model.SchedulerConfig;
import egovframework.let.scheduler.domain.model.SchedulerConfigVO;
import egovframework.let.scheduler.service.SchedulerConfigService;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

/**
 * 스케쥴러 설정 관리 컨트롤러
 * @author AI Assistant
 * @since 2025.10.23
 * @version 1.0
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "SchedulerConfigApiController", description = "스케쥴러 설정 관리")
@RequestMapping("/api/schedulers")
public class SchedulerConfigApiController {

    public static final String HEADER_STRING = "Authorization";
        private static final long MAX_EXECUTION_RANGE_DAYS = 31;
    private final EgovJwtTokenUtil jwtTokenUtil;
    private final ResultVoHelper resultVoHelper;
    private final SchedulerConfigService schedulerConfigService;
    private final EgovPropertyService propertyService;

        private void validateExecutionDateRange(String fromDate, String toDate) {
                if ((fromDate == null || fromDate.trim().isEmpty()) && (toDate == null || toDate.trim().isEmpty())) {
                        return;
                }

                if (fromDate == null || fromDate.trim().isEmpty() || toDate == null || toDate.trim().isEmpty()) {
                        throw new IllegalStateException("시작 날짜와 종료 날짜를 모두 입력해주세요.");
                }

                final LocalDate from;
                final LocalDate to;
                try {
                        from = LocalDate.parse(fromDate);
                        to = LocalDate.parse(toDate);
                } catch (DateTimeParseException e) {
                        throw new IllegalStateException("날짜 형식이 올바르지 않습니다. (yyyy-MM-dd)");
                }

                if (from.isAfter(to)) {
                        throw new IllegalStateException("시작 날짜는 종료 날짜보다 늦을 수 없습니다.");
                }

                long periodDays = ChronoUnit.DAYS.between(from, to) + 1;
                if (periodDays > MAX_EXECUTION_RANGE_DAYS) {
                        throw new IllegalStateException("조회 기간은 최대 " + MAX_EXECUTION_RANGE_DAYS + "일까지 가능합니다.");
                }
        }

    /**
     * 스케쥴러 목록을 조회한다.
     */
    @Operation(
            summary = "스케쥴러 목록 조회",
            description = "스케쥴러 목록을 조회",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"SchedulerConfigApiController"}
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "인가된 사용자가 아님")
    })
    @GetMapping
    public ResultVO selectSchedulerList(@ModelAttribute SchedulerConfigVO searchVO,
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

        Map<String, Object> resultMap = schedulerConfigService.selectSchedulerList(searchVO);
        int totCnt = Integer.parseInt((String) resultMap.get("resultCnt"));
        paginationInfo.setTotalRecordCount(totCnt);
        resultMap.put("paginationInfo", paginationInfo);
        resultMap.put("user", user);

        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    /**
     * 스케쥴러 상세 정보를 조회한다.
     */
    @Operation(
            summary = "스케쥴러 상세 조회",
            description = "스케쥴러 상세 정보를 조회",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"SchedulerConfigApiController"}
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "인가된 사용자가 아님"),
            @ApiResponse(responseCode = "404", description = "데이터를 찾을 수 없음")
    })
    @GetMapping("/{schedulerId}")
    public ResultVO selectSchedulerDetail(@Parameter(description = "스케쥴러 ID") @PathVariable Long schedulerId,
                                          @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user)
            throws Exception {

        SchedulerConfig scheduler = schedulerConfigService.selectSchedulerDetail(schedulerId);
        if (scheduler == null) {
            return resultVoHelper.buildFromMap(new HashMap<>(), ResponseCode.INPUT_CHECK_ERROR);
        }

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("scheduler", scheduler);
        resultMap.put("user", user);

        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    /**
     * 스케쥴러를 등록한다.
     */
    @Operation(
            summary = "스케쥴러 등록",
            description = "새로운 스케쥴러를 등록",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"SchedulerConfigApiController"}
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "등록 성공"),
            @ApiResponse(responseCode = "403", description = "인가된 사용자가 아님")
    })
    @PostMapping
    public ResultVO insertScheduler(@RequestBody SchedulerConfig scheduler,
                                     @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user)
            throws Exception {

        scheduler.setRegUserId(user.getId());
        schedulerConfigService.insertScheduler(scheduler);

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("message", "스케쥴러가 등록되었습니다.");

        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    /**
     * 스케쥴러를 수정한다.
     */
    @Operation(
            summary = "스케쥴러 수정",
            description = "스케쥴러 정보를 수정",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"SchedulerConfigApiController"}
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "수정 성공"),
            @ApiResponse(responseCode = "403", description = "인가된 사용자가 아님")
    })
    @PutMapping("/{schedulerId}")
    public ResultVO updateScheduler(@Parameter(description = "스케쥴러 ID") @PathVariable Long schedulerId,
                                     @RequestBody SchedulerConfig scheduler,
                                     @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user)
            throws Exception {

        scheduler.setSchedulerId(schedulerId);
        scheduler.setUpdUserId(user.getId());
        schedulerConfigService.updateScheduler(scheduler);

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("message", "스케쥴러가 수정되었습니다.");

        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    /**
     * 스케쥴러를 삭제한다.
     */
    @Operation(
            summary = "스케쥴러 삭제",
            description = "스케쥴러를 삭제",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"SchedulerConfigApiController"}
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "삭제 성공"),
            @ApiResponse(responseCode = "403", description = "인가된 사용자가 아님")
    })
    @DeleteMapping("/{schedulerId}")
    public ResultVO deleteScheduler(@Parameter(description = "스케쥴러 ID") @PathVariable Long schedulerId,
                                     @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user)
            throws Exception {

        schedulerConfigService.deleteScheduler(schedulerId);

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("message", "스케쥴러가 삭제되었습니다.");

        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    /**
     * 스케쥴러를 재시작한다.
     */
    @Operation(
            summary = "스케쥴러 재시작",
            description = "모든 스케쥴러를 재시작",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"SchedulerConfigApiController"}
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "재시작 성공"),
            @ApiResponse(responseCode = "403", description = "인가된 사용자가 아님")
    })
    @PostMapping("/restart")
    public ResultVO restartSchedulers(@Parameter(hidden = true) @AuthenticationPrincipal LoginVO user)
            throws Exception {

        schedulerConfigService.restartSchedulers();

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("message", "스케쥴러가 재시작되었습니다.");

        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    /**
     * 스케쥴러 상태를 확인한다. (Health Check)
     */
    @Operation(
            summary = "스케쥴러 상태 확인",
            description = "스케쥴러 시스템의 상태를 확인 (초기화 여부, 활성 작업 수 등)",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"SchedulerConfigApiController"}
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "인가된 사용자가 아님")
    })
    @GetMapping("/health")
    public ResultVO checkSchedulerHealth(@Parameter(hidden = true) @AuthenticationPrincipal LoginVO user)
            throws Exception {

        Map<String, Object> healthStatus = schedulerConfigService.getSchedulerHealthStatus();

        return resultVoHelper.buildFromMap(healthStatus, ResponseCode.SUCCESS);
    }

    /**
     * 특정 스케쥴러를 즉시 실행한다.
     */
    @Operation(
            summary = "스케쥴러 즉시 실행",
            description = "특정 스케쥴러를 즉시 실행 (날짜 범위 지정 가능)",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"SchedulerConfigApiController"}
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "실행 성공"),
            @ApiResponse(responseCode = "403", description = "인가된 사용자가 아님"),
            @ApiResponse(responseCode = "404", description = "스케쥴러를 찾을 수 없음")
    })
        @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @PostMapping("/{schedulerId}/execute")
    public ResultVO executeScheduler(@Parameter(description = "스케쥴러 ID") @PathVariable Long schedulerId,
                                      @Parameter(description = "조회 시작 날짜 (yyyy-MM-dd)") @RequestParam(required = false) String fromDate,
                                      @Parameter(description = "조회 종료 날짜 (yyyy-MM-dd)") @RequestParam(required = false) String toDate,
                                      @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user)
            throws Exception {

                validateExecutionDateRange(fromDate, toDate);

        schedulerConfigService.executeSchedulerManually(schedulerId, fromDate, toDate);

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("message", "스케쥴러가 실행되었습니다.");

        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }
}
