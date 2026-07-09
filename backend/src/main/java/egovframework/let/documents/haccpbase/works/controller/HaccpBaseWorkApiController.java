package egovframework.let.documents.haccpbase.works.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import egovframework.com.cmm.LoginVO;
import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.EgovUserDetailsHelper;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.let.documents.haccpbase.works.domain.model.HaccpBaseWorkSaveRequestVO;
import egovframework.let.documents.haccpbase.works.domain.model.HaccpBaseWorkVO;
import egovframework.let.documents.haccpbase.works.service.HaccpBaseWorkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * HACCP 양식 업무 관리를 위한 컨트롤러 클래스
 * @author SHMT-MES
 * @since 2026.07.07
 * @version 1.0
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/haccp-base/works")
@Tag(name = "HaccpBaseWorkApiController", description = "HACCP 양식 업무 관리")
public class HaccpBaseWorkApiController {

    private final ResultVoHelper resultVoHelper;
    private final HaccpBaseWorkService haccpBaseWorkService;

    @Operation(
            summary = "업무 목록 조회",
            description = "HACCP 양식 업무 목록을 조회한다",
            security = { @SecurityRequirement(name = "Authorization") },
            tags = { "HaccpBaseWorkApiController" }
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "인가된 사용자가 아님")
    })
    @GetMapping
    public ResultVO listWorks(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestParam(required = false) String active,
            @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        List<HaccpBaseWorkVO> resultList = haccpBaseWorkService.listWorks(tenantCode, active);

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("resultList", resultList);
        resultMap.put("user", user);

        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @Operation(
            summary = "업무 등록",
            description = "HACCP 양식 업무를 등록한다",
            security = { @SecurityRequirement(name = "Authorization") },
            tags = { "HaccpBaseWorkApiController" }
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "등록 성공"),
            @ApiResponse(responseCode = "403", description = "인가된 사용자가 아님")
    })
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResultVO createWork(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestBody HaccpBaseWorkSaveRequestVO payload,
            @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user,
            HttpServletRequest request) throws Exception {
        payload.setTenantCode(resolveTenantCode(tenantHeader, request));
        try {
            HaccpBaseWorkVO item = haccpBaseWorkService.createWork(payload, resolveLoginCode(user));
            Map<String, Object> resultMap = new HashMap<String, Object>();
            resultMap.put("item", item);
            resultMap.put("message", "업무가 성공적으로 등록되었습니다.");
            resultMap.put("user", user);
            return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
        } catch (IllegalArgumentException ex) {
            Map<String, Object> errorMap = new HashMap<String, Object>();
            errorMap.put("message", ex.getMessage());
            return resultVoHelper.buildFromMap(errorMap, ResponseCode.INPUT_CHECK_ERROR);
        }
    }

    @Operation(
            summary = "업무 수정",
            description = "HACCP 양식 업무를 수정한다",
            security = { @SecurityRequirement(name = "Authorization") },
            tags = { "HaccpBaseWorkApiController" }
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "수정 성공"),
            @ApiResponse(responseCode = "403", description = "인가된 사용자가 아님")
    })
    @PutMapping("/{id}")
    public ResultVO updateWork(
            @PathVariable Long id,
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestBody HaccpBaseWorkSaveRequestVO payload,
            @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user,
            HttpServletRequest request) throws Exception {
        payload.setTenantCode(resolveTenantCode(tenantHeader, request));
        try {
            HaccpBaseWorkVO item = haccpBaseWorkService.updateWork(id, payload, resolveLoginCode(user));
            Map<String, Object> resultMap = new HashMap<String, Object>();
            resultMap.put("item", item);
            resultMap.put("message", "업무가 성공적으로 수정되었습니다.");
            resultMap.put("user", user);
            return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
        } catch (IllegalArgumentException ex) {
            Map<String, Object> errorMap = new HashMap<String, Object>();
            errorMap.put("message", ex.getMessage());
            return resultVoHelper.buildFromMap(errorMap, ResponseCode.INPUT_CHECK_ERROR);
        } catch (ResponseStatusException ex) {
            throw ex;
        }
    }

    private String resolveTenantCode(String tenantHeader, HttpServletRequest request) {
        if (StringUtils.hasText(tenantHeader)) {
            return tenantHeader.trim().toUpperCase();
        }

        Object userDetails = EgovUserDetailsHelper.getAuthenticatedUser();
        if (userDetails instanceof LoginVO) {
            LoginVO loginVO = (LoginVO) userDetails;
            if (StringUtils.hasText(loginVO.getTenantCode())) {
                return loginVO.getTenantCode().trim().toUpperCase();
            }
        }

        Object attributeTenantCode = request.getAttribute("tenantCode");
        if (attributeTenantCode != null && StringUtils.hasText(String.valueOf(attributeTenantCode))) {
            return String.valueOf(attributeTenantCode).trim().toUpperCase();
        }

        return "PLATFORM";
    }

    private String resolveLoginCode(LoginVO user) {
        if (user != null && StringUtils.hasText(user.getId())) {
            return user.getId().trim();
        }

        Object userDetails = EgovUserDetailsHelper.getAuthenticatedUser();
        if (userDetails instanceof LoginVO) {
            LoginVO loginVO = (LoginVO) userDetails;
            if (StringUtils.hasText(loginVO.getId())) {
                return loginVO.getId().trim();
            }
        }
        return null;
    }
}
