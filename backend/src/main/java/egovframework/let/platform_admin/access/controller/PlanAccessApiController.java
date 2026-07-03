package egovframework.let.platform_admin.access.controller;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.List;
import java.util.Collections;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ResponseStatusException;

import egovframework.com.cmm.LoginVO;
import egovframework.com.cmm.util.EgovUserDetailsHelper;
import egovframework.let.platform_admin.access.domain.model.PlanSummaryVO;
import egovframework.let.platform_admin.access.web.PlanAccessLevel;
import egovframework.let.platform_admin.access.web.PlanAccessPolicy;
import egovframework.let.platform_admin.access.service.PlanAccessService;
import lombok.RequiredArgsConstructor;

/**
 * 플랜 접근 제어 API 컨트롤러
 * @author SHMT-MES
 * @since 2026.07.03
 * @version 1.0
 * @see
 *
 * <pre>
 * << 개정이력(Modification Information) >>
 *
 *   수정일      수정자           수정내용
 *  -------    --------    ---------------------------
 *   2026.07.03 SHMT-MES          최초 생성
 *
 * </pre>
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "PlanAccessApiController", description = "플랜 접근 제어 관리")
@RequestMapping("/api/platform-admin/plan-access")
public class PlanAccessApiController {

    private final PlanAccessService planAccessService;

        /**
         * 로그인 사용자 기준 현재 플랜 접근 정보를 조회한다.
         */
        @Operation(
            summary = "내 플랜 접근 정보 조회",
            description = "로그인 사용자 기준 플랜 코드 및 feature 접근 정보를 조회",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"PlanAccessApiController"}
        )
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "테넌트 정보 없음")
        })
    @PlanAccessPolicy(
            menuUrl = "/platform/plans",
            featureCode = "FEATURE_PLATFORM_TENANT_MGMT",
            requiredPermissionLevel = PlanAccessLevel.READ,
            skipRolePermissionCheck = true
    )
    @GetMapping("/me")
    public Map<String, Object> getCurrentTenantPlanAccess() {
        LoginVO loginVO = resolveCurrentUser();
        Long tenantId = resolveTenantId(loginVO);
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "테넌트 정보를 확인할 수 없습니다.");
        }

        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("tenantId", tenantId);
        result.put("tenantCode", loginVO.getTenantCode());
        result.put("planCode", planAccessService.resolveActivePlanCode(tenantId));
        result.put("features", planAccessService.resolveFeatureEnabledMap(tenantId));
        return result;
    }

        /**
         * 플랜 목록을 조회한다.
         */
        @Operation(
            summary = "플랜 목록 조회",
            description = "플랫폼 플랜 목록을 조회",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"PlanAccessApiController"}
        )
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "인가 실패")
        })
    @PlanAccessPolicy(
            menuUrl = "/platform/plans",
            featureCode = "FEATURE_PLATFORM_TENANT_MGMT",
            requiredPermissionLevel = PlanAccessLevel.READ
    )
    @GetMapping("/plans")
    public List<PlanSummaryVO> listPlans() {
        return planAccessService.listPlans();
    }

        /**
         * 플랜별 feature 목록을 조회한다.
         */
        @Operation(
            summary = "플랜 feature 조회",
            description = "플랜 코드 기준 feature 목록을 조회",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"PlanAccessApiController"}
        )
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "인가 실패")
        })
    @PlanAccessPolicy(
            menuUrl = "/platform/plans",
            featureCode = "FEATURE_PLATFORM_TENANT_MGMT",
            requiredPermissionLevel = PlanAccessLevel.READ
    )
    @GetMapping("/plans/{planCode}/features")
        public Map<String, Object> getPlanFeatures(@Parameter(description = "플랜 코드") @PathVariable String planCode) {
        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("planCode", planCode == null ? "" : planCode.trim().toUpperCase());
        result.put("features", planAccessService.resolvePlanFeatureItems(planCode));
        return result;
    }

        /**
         * 플랜별 메뉴 코드 목록을 조회한다.
         */
        @Operation(
            summary = "플랜 메뉴 조회",
            description = "플랜 코드 기준 메뉴 코드 목록을 조회",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"PlanAccessApiController"}
        )
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "인가 실패")
        })
    @PlanAccessPolicy(
            menuUrl = "/platform/plans",
            featureCode = "FEATURE_PLATFORM_TENANT_MGMT",
            requiredPermissionLevel = PlanAccessLevel.READ
    )
    @GetMapping("/plans/{planCode}/menus")
        public Map<String, Object> getPlanMenus(@Parameter(description = "플랜 코드") @PathVariable String planCode) {
        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("planCode", planCode == null ? "" : planCode.trim().toUpperCase());
        result.put("menuCodes", planAccessService.resolvePlanMenuCodes(planCode));
        return result;
    }

        /**
         * 플랜별 메뉴 코드를 교체한다.
         */
        @Operation(
            summary = "플랜 메뉴 교체",
            description = "플랜 코드 기준 메뉴 매핑을 교체 저장",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"PlanAccessApiController"}
        )
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "저장 성공"),
            @ApiResponse(responseCode = "400", description = "입력값 오류"),
            @ApiResponse(responseCode = "403", description = "인가 실패")
        })
    @PlanAccessPolicy(
            menuUrl = "/platform/plans",
            featureCode = "FEATURE_PLATFORM_TENANT_MGMT",
            requiredPermissionLevel = PlanAccessLevel.WRITE
    )
    @PutMapping("/plans/{planCode}/menus")
    public Map<String, Object> replacePlanMenus(
            @Parameter(description = "플랜 코드") @PathVariable String planCode,
            @RequestBody Map<String, List<String>> payload) {
        if (!StringUtils.hasText(planCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "planCode는 필수입니다.");
        }

        List<String> menuCodes = payload == null
                ? Collections.emptyList()
                : payload.getOrDefault("menuCodes", Collections.emptyList());
        planAccessService.replacePlanMenus(planCode, menuCodes);

        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("planCode", planCode.trim().toUpperCase());
        result.put("menuCodes", planAccessService.resolvePlanMenuCodes(planCode));
        return result;
    }

    /**
     * 테넌트의 활성 플랜 메뉴 코드를 조회한다.
     */
    @Operation(
            summary = "테넌트 플랜 메뉴 조회",
            description = "테넌트 코드 기준 활성 플랜의 메뉴 코드 목록을 조회",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"PlanAccessApiController"}
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "400", description = "입력값 오류"),
            @ApiResponse(responseCode = "403", description = "인가 실패")
    })
    @PlanAccessPolicy(
            menuUrl = "/platform/plans",
            featureCode = "FEATURE_PLATFORM_TENANT_MGMT",
            requiredPermissionLevel = PlanAccessLevel.READ
    )
    @GetMapping("/tenant-plan-menus")
    public Map<String, Object> getTenantPlanMenus(@Parameter(description = "테넌트 코드") @RequestParam String tenantCode) {
        if (!StringUtils.hasText(tenantCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "tenantCode는 필수입니다.");
        }

        String normalizedTenantCode = tenantCode.trim().toUpperCase();
        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("tenantCode", normalizedTenantCode);
        result.put("menuCodes", planAccessService.resolveTenantPlanMenuCodes(normalizedTenantCode));
        return result;
    }

    private LoginVO resolveCurrentUser() {
        Object authenticatedUser;
        try {
            authenticatedUser = EgovUserDetailsHelper.getAuthenticatedUser();
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인 사용자 정보를 찾을 수 없습니다.");
        }

        if (!(authenticatedUser instanceof LoginVO)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인 사용자 정보를 찾을 수 없습니다.");
        }

        return (LoginVO) authenticatedUser;
    }

    private Long resolveTenantId(LoginVO loginVO) {
        if (loginVO.getTenantId() != null) {
            return loginVO.getTenantId();
        }

        if (!StringUtils.hasText(loginVO.getTenantCode())) {
            return null;
        }

        return planAccessService.resolveTenantIdByTenantCode(loginVO.getTenantCode());
    }
}
