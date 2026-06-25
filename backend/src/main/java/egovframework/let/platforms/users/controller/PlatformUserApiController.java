package egovframework.let.platforms.users.controller;

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
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import egovframework.com.cmm.LoginVO;
import egovframework.com.cmm.util.EgovUserDetailsHelper;
import egovframework.let.platforms.users.service.PlatformUserService;
import egovframework.let.platforms.users.service.PlatformUserService.UpsertUserRequest;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class PlatformUserApiController {

    private final PlatformUserService platformUserService;

    @GetMapping
    public List<Map<String, Object>> listUsers(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            HttpServletRequest request) {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        Long tenantId = resolveTenantId(tenantCode);
        return platformUserService.listUsers(tenantId, tenantCode);
    }

    @PostMapping
    public Map<String, Object> createUser(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestBody UpsertUserRequest payload,
            HttpServletRequest request) {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        Long tenantId = resolveTenantId(tenantCode);

        try {
            return platformUserService.createUser(tenantId, tenantCode, payload);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage(), ex);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "사용자 등록에 실패했습니다.", ex);
        }
    }

    @PutMapping("/{id}")
    public Map<String, Object> updateUser(
            @PathVariable Long id,
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestBody UpsertUserRequest payload,
            HttpServletRequest request) {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        Long tenantId = resolveTenantId(tenantCode);

        try {
            return platformUserService.updateUser(tenantId, tenantCode, id, payload);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage(), ex);
        }
    }

    @PatchMapping("/{id}")
    public Map<String, Object> updateUserStatus(
            @PathVariable Long id,
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestBody Map<String, Object> payload,
            HttpServletRequest request) {
        if (payload == null || !payload.containsKey("active")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "active 값은 필수입니다.");
        }

        boolean active = Boolean.TRUE.equals(payload.get("active"));
        String tenantCode = resolveTenantCode(tenantHeader, request);
        Long tenantId = resolveTenantId(tenantCode);

        try {
            return platformUserService.updateUserActive(tenantId, tenantCode, id, active);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage(), ex);
        }
    }

    private Long resolveTenantId(String tenantCode) {
        Long tenantId = platformUserService.resolveTenantIdByCode(tenantCode);
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "tenantCode를 확인할 수 없습니다.");
        }
        return tenantId;
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

        Map<String, String> fallbackByHost = new LinkedHashMap<String, String>();
        fallbackByHost.put("localhost", "TENANT-A");

        String host = request.getServerName();
        if (host != null) {
            String normalizedHost = host.toLowerCase();
            if (fallbackByHost.containsKey(normalizedHost)) {
                return fallbackByHost.get(normalizedHost);
            }
        }

        return "PLATFORM";
    }
}
