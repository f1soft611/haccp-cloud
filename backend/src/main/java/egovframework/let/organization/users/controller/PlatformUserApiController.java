package egovframework.let.organization.users.controller;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import egovframework.com.cmm.LoginVO;
import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.EgovUserDetailsHelper;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.let.organization.users.domain.model.PlatformUserImageUpdateRequestVO;
import egovframework.let.organization.users.domain.model.PlatformUserPasswordChangeRequestVO;
import egovframework.let.organization.users.domain.model.PlatformUserSaveRequestVO;
import egovframework.let.organization.users.domain.model.PlatformUserVO;
import egovframework.let.organization.users.service.PlatformUserService;
import lombok.RequiredArgsConstructor;

/**
 * 플랫폼 사용자 관리를 위한 컨트롤러 클래스
 * @author SHMT-MES
 * @since 2026.07.14
 * @version 1.0
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
public class PlatformUserApiController {

    private final PlatformUserService platformUserService;
    private final ResultVoHelper resultVoHelper;

    @GetMapping
    public ResultVO listUsers(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        List<?> resultList = platformUserService.listUsers(tenantCode);

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("resultList", resultList);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @GetMapping("/me")
    public ResultVO getMyPageUser(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            HttpServletRequest request) throws Exception {
        Object userDetails = EgovUserDetailsHelper.getAuthenticatedUser();
        if (!(userDetails instanceof LoginVO)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증 정보가 없습니다.");
        }

        LoginVO loginVO = (LoginVO) userDetails;
        String tenantCode = resolveTenantCode(tenantHeader, request);
        PlatformUserVO item = platformUserService.getMyPageUser(tenantCode, loginVO.getId());

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("item", item);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @PatchMapping("/me/password")
    public ResultVO changeMyPassword(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestBody PlatformUserPasswordChangeRequestVO payload,
            HttpServletRequest request) throws Exception {
        Object userDetails = EgovUserDetailsHelper.getAuthenticatedUser();
        if (!(userDetails instanceof LoginVO)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증 정보가 없습니다.");
        }

        LoginVO loginVO = (LoginVO) userDetails;
        String tenantCode = resolveTenantCode(tenantHeader, request);

        try {
            platformUserService.changeMyPassword(tenantCode, loginVO.getId(), payload);
            Map<String, Object> resultMap = new HashMap<String, Object>();
            resultMap.put("message", "비밀번호가 성공적으로 변경되었습니다.");
            return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
        } catch (IllegalArgumentException ex) {
            Map<String, Object> errorMap = new HashMap<String, Object>();
            errorMap.put("message", ex.getMessage());
            return resultVoHelper.buildFromMap(errorMap, ResponseCode.INPUT_CHECK_ERROR);
        } catch (IllegalStateException ex) {
            Map<String, Object> errorMap = new HashMap<String, Object>();
            errorMap.put("message", ex.getMessage());
            return resultVoHelper.buildFromMap(errorMap, ResponseCode.BUSINESS_ERROR);
        }
    }

    @PatchMapping("/me/images")
    public ResultVO changeMyImages(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestBody PlatformUserImageUpdateRequestVO payload,
            HttpServletRequest request) throws Exception {
        Object userDetails = EgovUserDetailsHelper.getAuthenticatedUser();
        if (!(userDetails instanceof LoginVO)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증 정보가 없습니다.");
        }

        LoginVO loginVO = (LoginVO) userDetails;
        String tenantCode = resolveTenantCode(tenantHeader, request);

        try {
            PlatformUserVO item = platformUserService.changeMyImages(tenantCode, loginVO.getId(), payload);
            Map<String, Object> resultMap = new HashMap<String, Object>();
            resultMap.put("item", item);
            resultMap.put("message", "이미지가 성공적으로 저장되었습니다.");
            return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
        } catch (IllegalArgumentException ex) {
            Map<String, Object> errorMap = new HashMap<String, Object>();
            errorMap.put("message", ex.getMessage());
            return resultVoHelper.buildFromMap(errorMap, ResponseCode.INPUT_CHECK_ERROR);
        } catch (IllegalStateException ex) {
            Map<String, Object> errorMap = new HashMap<String, Object>();
            errorMap.put("message", ex.getMessage());
            return resultVoHelper.buildFromMap(errorMap, ResponseCode.BUSINESS_ERROR);
        }
    }

    @GetMapping("/paged")
    public ResultVO listUsersPaged(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestParam(defaultValue = "1") int pageIndex,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String filterActive,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        Map<String, Object> result = platformUserService.listUsersPaged(pageIndex, pageSize, keyword, filterActive, tenantCode);
        Map<String, Object> response = new LinkedHashMap<String, Object>();
        response.put("items", result.get("userList"));
        response.put("totalCount", result.get("totalCount"));
        response.put("paginationInfo", result.get("paginationInfo"));
        return resultVoHelper.buildFromMap(response, ResponseCode.SUCCESS);
    }

    @PostMapping
    public ResultVO createUser(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestBody PlatformUserSaveRequestVO payload,
            HttpServletRequest request) throws Exception {
        payload.setTenantCode(resolveTenantCode(tenantHeader, request));
        try {
            PlatformUserVO item = platformUserService.createUser(payload);
            Map<String, Object> resultMap = new HashMap<String, Object>();
            resultMap.put("item", item);
            resultMap.put("message", "사용자가 성공적으로 등록되었습니다.");
            return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
        } catch (IllegalArgumentException ex) {
            Map<String, Object> errorMap = new HashMap<String, Object>();
            errorMap.put("message", ex.getMessage());
            return resultVoHelper.buildFromMap(errorMap, ResponseCode.INPUT_CHECK_ERROR);
        } catch (IllegalStateException ex) {
            Map<String, Object> errorMap = new HashMap<String, Object>();
            errorMap.put("message", ex.getMessage());
            return resultVoHelper.buildFromMap(errorMap, ResponseCode.BUSINESS_ERROR);
        }
    }

    @PutMapping("/{id}")
    public ResultVO updateUser(
            @PathVariable Long id,
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestBody PlatformUserSaveRequestVO payload,
            HttpServletRequest request) throws Exception {
        payload.setTenantCode(resolveTenantCode(tenantHeader, request));
        try {
            PlatformUserVO item = platformUserService.updateUser(id, payload);
            Map<String, Object> resultMap = new HashMap<String, Object>();
            resultMap.put("item", item);
            resultMap.put("message", "사용자가 성공적으로 수정되었습니다.");
            return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
        } catch (IllegalArgumentException ex) {
            Map<String, Object> errorMap = new HashMap<String, Object>();
            errorMap.put("message", ex.getMessage());
            return resultVoHelper.buildFromMap(errorMap, ResponseCode.INPUT_CHECK_ERROR);
        } catch (IllegalStateException ex) {
            Map<String, Object> errorMap = new HashMap<String, Object>();
            errorMap.put("message", ex.getMessage());
            return resultVoHelper.buildFromMap(errorMap, ResponseCode.BUSINESS_ERROR);
        }
    }

    @PatchMapping("/{id}")
    public ResultVO updateUserStatus(
            @PathVariable Long id,
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestBody Map<String, Object> payload,
            HttpServletRequest request) throws Exception {
        if (payload == null || !payload.containsKey("active")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "active 값은 필수입니다.");
        }

        PlatformUserSaveRequestVO requestVO = new PlatformUserSaveRequestVO();
        requestVO.setTenantCode(resolveTenantCode(tenantHeader, request));
        requestVO.setActive(Boolean.TRUE.equals(payload.get("active")));

        try {
            PlatformUserVO item = platformUserService.updateUserActive(id, requestVO);
            Map<String, Object> resultMap = new HashMap<String, Object>();
            resultMap.put("item", item);
            resultMap.put("message", "사용자 상태가 성공적으로 변경되었습니다.");
            return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
        } catch (IllegalArgumentException ex) {
            Map<String, Object> errorMap = new HashMap<String, Object>();
            errorMap.put("message", ex.getMessage());
            return resultVoHelper.buildFromMap(errorMap, ResponseCode.INPUT_CHECK_ERROR);
        } catch (IllegalStateException ex) {
            Map<String, Object> errorMap = new HashMap<String, Object>();
            errorMap.put("message", ex.getMessage());
            return resultVoHelper.buildFromMap(errorMap, ResponseCode.BUSINESS_ERROR);
        }
    }

    @PatchMapping("/{id}/password-reset")
    public ResultVO resetPassword(
            @PathVariable Long id,
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);

        try {
            String tempPassword = platformUserService.resetPassword(id, tenantCode);
            Map<String, Object> resultMap = new HashMap<String, Object>();
            resultMap.put("tempPassword", tempPassword);
            resultMap.put("message", "비밀번호가 성공적으로 초기화되었습니다.");
            return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
        } catch (IllegalArgumentException ex) {
            Map<String, Object> errorMap = new HashMap<String, Object>();
            errorMap.put("message", ex.getMessage());
            return resultVoHelper.buildFromMap(errorMap, ResponseCode.INPUT_CHECK_ERROR);
        } catch (IllegalStateException ex) {
            Map<String, Object> errorMap = new HashMap<String, Object>();
            errorMap.put("message", ex.getMessage());
            return resultVoHelper.buildFromMap(errorMap, ResponseCode.BUSINESS_ERROR);
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
}
