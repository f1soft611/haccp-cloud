package egovframework.let.organization.users.controller;

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
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.EgovUserDetailsHelper;
import egovframework.let.organization.users.domain.model.PlatformUserSaveRequestVO;
import egovframework.let.organization.users.domain.model.PlatformUserVO;
import egovframework.let.organization.users.service.PlatformUserService;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class PlatformUserApiController {

    private final PlatformUserService platformUserService;

    @GetMapping
    public List<?> listUsers(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        return platformUserService.listUsers(tenantCode);
    }

    @GetMapping("/paged")
    public Map<String, Object> listUsersPaged(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestParam(defaultValue = "1") int pageIndex,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String filterActive,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        ResultVO resultVO = platformUserService.listUsersPaged(pageIndex, pageSize, keyword, filterActive, tenantCode);
        Map<String, Object> result = resultVO.getResult();
        Map<String, Object> response = new LinkedHashMap<String, Object>();
        response.put("items", result.get("userList"));
        response.put("totalCount", result.get("totalCount"));
        response.put("paginationInfo", result.get("paginationInfo"));
        return response;
    }

    @PostMapping
    public PlatformUserVO createUser(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestBody PlatformUserSaveRequestVO payload,
            HttpServletRequest request) throws Exception {
        payload.setTenantCode(resolveTenantCode(tenantHeader, request));
        try {
            return platformUserService.createUser(payload);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage(), ex);
        }
    }

    @PutMapping("/{id}")
    public PlatformUserVO updateUser(
            @PathVariable Long id,
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestBody PlatformUserSaveRequestVO payload,
            HttpServletRequest request) throws Exception {
        payload.setTenantCode(resolveTenantCode(tenantHeader, request));
        try {
            return platformUserService.updateUser(id, payload);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage(), ex);
        }
    }

    @PatchMapping("/{id}")
    public PlatformUserVO updateUserStatus(
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
            return platformUserService.updateUserActive(id, requestVO);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage(), ex);
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
