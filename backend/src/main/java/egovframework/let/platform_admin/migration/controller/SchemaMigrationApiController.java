package egovframework.let.platform_admin.migration.controller;

import java.util.HashMap;
import java.util.Map;

import javax.annotation.Resource;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import egovframework.com.cmm.LoginVO;
import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.let.platform_admin.migration.service.SchemaMigrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;

/**
 * 플랫폼 관리 > DB 마이그레이션. PLATFORM_ADMIN 전용.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/platform-admin/migrations")
@Tag(name = "SchemaMigrationApiController", description = "DB 마이그레이션 관리")
public class SchemaMigrationApiController {

    @Resource(name = "schemaMigrationService")
    private SchemaMigrationService schemaMigrationService;

    @Resource(name = "resultVoHelper")
    private ResultVoHelper resultVoHelper;

    @Operation(summary = "마이그레이션 목록", security = {@SecurityRequirement(name = "Authorization")},
            tags = {"SchemaMigrationApiController"})
    @GetMapping
    public ResultVO list(@Parameter(hidden = true) @AuthenticationPrincipal LoginVO user) {
        if (!isPlatformAdmin(user)) {
            return resultVoHelper.buildFromMap(new HashMap<>(), ResponseCode.AUTH_ERROR);
        }
        try {
            Map<String, Object> result = new HashMap<>();
            result.put("migrations", schemaMigrationService.list());
            return resultVoHelper.buildFromMap(result, ResponseCode.SUCCESS);
        } catch (Exception e) {
            log.error("마이그레이션 목록 조회 실패", e);
            return error(ResponseCode.INTERNAL_SERVER_ERROR, "마이그레이션 목록 조회에 실패했습니다.");
        }
    }

    @Operation(summary = "마이그레이션 상세", security = {@SecurityRequirement(name = "Authorization")},
            tags = {"SchemaMigrationApiController"})
    @GetMapping("/{migrationId:.+}")
    public ResultVO detail(@PathVariable String migrationId,
                           @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user) {
        if (!isPlatformAdmin(user)) {
            return resultVoHelper.buildFromMap(new HashMap<>(), ResponseCode.AUTH_ERROR);
        }
        try {
            return resultVoHelper.buildFromMap(schemaMigrationService.detail(migrationId), ResponseCode.SUCCESS);
        } catch (IllegalArgumentException e) {
            return error(ResponseCode.BUSINESS_ERROR, e.getMessage());
        } catch (Exception e) {
            log.error("마이그레이션 상세 조회 실패 migrationId={}", migrationId, e);
            return error(ResponseCode.INTERNAL_SERVER_ERROR, "마이그레이션 상세 조회에 실패했습니다.");
        }
    }

    @Operation(summary = "마이그레이션 적용", security = {@SecurityRequirement(name = "Authorization")},
            tags = {"SchemaMigrationApiController"})
    @PostMapping("/{migrationId:.+}/apply")
    public ResultVO apply(@PathVariable String migrationId,
                          @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user) {
        if (!isPlatformAdmin(user)) {
            return resultVoHelper.buildFromMap(new HashMap<>(), ResponseCode.AUTH_ERROR);
        }
        try {
            Map<String, Object> result = new HashMap<>();
            result.put("results", schemaMigrationService.apply(migrationId, user.getId()));
            return resultVoHelper.buildFromMap(result, ResponseCode.SUCCESS);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return error(ResponseCode.BUSINESS_ERROR, e.getMessage());
        } catch (Exception e) {
            log.error("마이그레이션 적용 실패 migrationId={}", migrationId, e);
            return error(ResponseCode.INTERNAL_SERVER_ERROR, "마이그레이션 적용에 실패했습니다.");
        }
    }

    private boolean isPlatformAdmin(LoginVO user) {
        return user != null
                && StringUtils.hasText(user.getRoleCode())
                && "PLATFORM_ADMIN".equalsIgnoreCase(user.getRoleCode());
    }

    private ResultVO error(ResponseCode code, String message) {
        Map<String, Object> errorMap = new HashMap<>();
        errorMap.put("message", message);
        return resultVoHelper.buildFromMap(errorMap, code, message);
    }
}