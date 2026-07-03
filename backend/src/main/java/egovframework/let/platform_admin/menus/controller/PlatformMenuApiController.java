package egovframework.let.platform_admin.menus.controller;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.Resource;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.let.platform_admin.access.web.PlanAccessLevel;
import egovframework.let.platform_admin.access.web.PlanAccessPolicy;
import egovframework.let.platform_admin.menus.service.PlatformMenuService;
import egovframework.let.uss.auth.service.MenuInfoVO;
import lombok.RequiredArgsConstructor;

/**
 * 플랫폼 관리자 메뉴 관리 API
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
@Tag(name = "PlatformMenuApiController", description = "플랫폼 메뉴 관리")
@RequestMapping("/api/v1/platform-admin/menus")
public class PlatformMenuApiController {

    private static final int[] ALLOWED_PAGE_SIZES = {10, 20, 50};

    @Resource(name = "platformMenuService")
    private PlatformMenuService platformMenuService;

    @Resource(name = "resultVoHelper")
    private ResultVoHelper resultVoHelper;

        /**
         * 공통 메뉴 목록을 조회한다.
         */
        @Operation(
            summary = "공통 메뉴 목록 조회",
            description = "플랜/권한 정책 적용 전 공통 메뉴 목록을 조회",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"PlatformMenuApiController"}
        )
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공")
        })
    @GetMapping("/common")
    public ResultVO listCommonMenus(
            @Parameter(description = "메뉴명") @RequestParam(required = false) String menuNm,
            @Parameter(description = "상위 메뉴 ID") @RequestParam(required = false) Long parentMenuId) throws Exception {
        List<MenuInfoVO> menus = platformMenuService.listMenus(menuNm, parentMenuId);
        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("items", menus);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

        /**
         * 메뉴 목록을 조회한다.
         */
        @Operation(
            summary = "메뉴 목록 조회",
            description = "권한 기반 메뉴 목록을 조회",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"PlatformMenuApiController"}
        )
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "인가 실패")
        })
        @PlanAccessPolicy(
            menuUrl = "/platform/menus",
            featureCode = "FEATURE_PLATFORM_MENU_MGMT",
            requiredPermissionLevel = PlanAccessLevel.READ
        )
    @GetMapping
    public ResultVO listMenus(
            @Parameter(description = "메뉴명") @RequestParam(required = false) String menuNm,
            @Parameter(description = "상위 메뉴 ID") @RequestParam(required = false) Long parentMenuId) throws Exception {
        List<MenuInfoVO> menus = platformMenuService.listMenus(menuNm, parentMenuId);
        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("items", menus);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

        /**
         * 메뉴 목록(페이징)을 조회한다.
         */
        @Operation(
            summary = "메뉴 목록(페이징) 조회",
            description = "검색 조건 기반 메뉴 페이징 목록을 조회",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"PlatformMenuApiController"}
        )
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "400", description = "입력값 오류"),
            @ApiResponse(responseCode = "403", description = "인가 실패")
        })
        @PlanAccessPolicy(
            menuUrl = "/platform/menus",
            featureCode = "FEATURE_PLATFORM_MENU_MGMT",
            requiredPermissionLevel = PlanAccessLevel.READ
        )
    @GetMapping("/paged")
    public ResultVO listMenusPaged(
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "1") int pageIndex,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "10") int pageSize,
            @Parameter(description = "검색 필드") @RequestParam(required = false) String searchField,
            @Parameter(description = "검색어") @RequestParam(required = false) String searchKeyword,
            @Parameter(description = "사용 여부") @RequestParam(required = false, defaultValue = "all") String useAt) throws Exception {
        validatePage(pageIndex, pageSize);
        validateSearchField(searchField);
        validateUseAt(useAt);

        return platformMenuService.listMenusPaged(
                pageIndex,
                pageSize,
                normalizeNullable(searchField),
                normalizeNullable(searchKeyword),
                hasText(useAt) ? useAt.trim().toUpperCase() : "all"
        );
    }

        /**
         * 메뉴를 등록한다.
         */
        @Operation(
            summary = "메뉴 등록",
            description = "신규 메뉴를 등록",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"PlatformMenuApiController"}
        )
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "등록 성공"),
            @ApiResponse(responseCode = "400", description = "입력값 오류"),
            @ApiResponse(responseCode = "403", description = "인가 실패")
        })
    @PlanAccessPolicy(
            menuUrl = "/platform/menus",
            featureCode = "FEATURE_PLATFORM_MENU_MGMT",
            requiredPermissionLevel = PlanAccessLevel.WRITE
    )
    @PostMapping
    public ResultVO createMenu(@RequestBody MenuInfoVO menuInfoVO) throws Exception {
        normalizePayload(menuInfoVO);
        validateForCreateOrUpdate(menuInfoVO, null);
        MenuInfoVO created = platformMenuService.createMenu(menuInfoVO);
        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("menu", created);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

        /**
         * 메뉴를 수정한다.
         */
        @Operation(
            summary = "메뉴 수정",
            description = "기존 메뉴를 수정",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"PlatformMenuApiController"}
        )
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "수정 성공"),
            @ApiResponse(responseCode = "400", description = "입력값 오류"),
            @ApiResponse(responseCode = "403", description = "인가 실패")
        })
    @PlanAccessPolicy(
            menuUrl = "/platform/menus",
            featureCode = "FEATURE_PLATFORM_MENU_MGMT",
            requiredPermissionLevel = PlanAccessLevel.WRITE
    )
    @PutMapping("/{menuId}")
    public ResultVO replaceMenu(@Parameter(description = "메뉴 ID") @PathVariable Long menuId, @RequestBody MenuInfoVO menuInfoVO) throws Exception {
        menuInfoVO.setMenuId(menuId);
        normalizePayload(menuInfoVO);
        validateForCreateOrUpdate(menuInfoVO, menuId);
        MenuInfoVO updated = platformMenuService.updateMenu(menuId, menuInfoVO);
        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("menu", updated);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @PlanAccessPolicy(
            menuUrl = "/platform/menus",
            featureCode = "FEATURE_PLATFORM_MENU_MGMT",
            requiredPermissionLevel = PlanAccessLevel.WRITE
    )
    @PatchMapping("/{menuId}")
    public ResultVO patchMenu(@Parameter(description = "메뉴 ID") @PathVariable Long menuId, @RequestBody MenuInfoVO menuInfoVO) throws Exception {
        menuInfoVO.setMenuId(menuId);
        normalizePayloadForPatch(menuInfoVO);
        validateForPatch(menuInfoVO, menuId);
        MenuInfoVO patched = platformMenuService.patchMenu(menuId, menuInfoVO);
        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("menu", patched);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

        /**
         * 메뉴를 삭제한다.
         */
        @Operation(
            summary = "메뉴 삭제",
            description = "메뉴를 삭제",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"PlatformMenuApiController"}
        )
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "삭제 성공"),
            @ApiResponse(responseCode = "403", description = "인가 실패")
        })
    @PlanAccessPolicy(
            menuUrl = "/platform/menus",
            featureCode = "FEATURE_PLATFORM_MENU_MGMT",
            requiredPermissionLevel = PlanAccessLevel.WRITE
    )
    @DeleteMapping("/{menuId}")
    public ResultVO deleteMenu(@Parameter(description = "메뉴 ID") @PathVariable Long menuId) throws Exception {
        platformMenuService.deleteMenu(menuId);
        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("menuId", menuId);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    private void validateForCreateOrUpdate(MenuInfoVO menuInfoVO, Long selfMenuId) throws Exception {
        Long parentMenuId = menuInfoVO.getParentMenuId();

        if (selfMenuId != null && hasText(menuInfoVO.getMenuCode())) {
            MenuInfoVO current = platformMenuService.getMenuDetail(selfMenuId);
            if (current != null && hasText(current.getMenuCode())) {
                String incomingCode = menuInfoVO.getMenuCode().trim().toUpperCase();
                String currentCode = current.getMenuCode().trim().toUpperCase();
                if (!incomingCode.equals(currentCode)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "메뉴 코드는 수정할 수 없습니다.");
                }
            }
        }

        if (!hasText(menuInfoVO.getMenuNm())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "메뉴명은 필수입니다.");
        }

        if (parentMenuId != null && !hasText(menuInfoVO.getMenuUrl())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "메뉴 URL은 필수입니다.");
        }

        if (parentMenuId == null) {
            return;
        }

        if (selfMenuId != null && selfMenuId.equals(parentMenuId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "상위 메뉴는 자기 자신으로 지정할 수 없습니다.");
        }

        MenuInfoVO parent = platformMenuService.getMenuDetail(parentMenuId);
        if (parent == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "상위 메뉴가 존재하지 않습니다.");
        }
    }

    private void normalizePayload(MenuInfoVO menuInfoVO) {
        if (hasText(menuInfoVO.getMenuCode())) {
            menuInfoVO.setMenuCode(menuInfoVO.getMenuCode().trim().toUpperCase());
        }

        if (menuInfoVO.getMenuNm() != null) {
            menuInfoVO.setMenuNm(menuInfoVO.getMenuNm().trim());
        }

        if (menuInfoVO.getMenuDc() != null) {
            menuInfoVO.setMenuDc(menuInfoVO.getMenuDc().trim());
        }

        if (menuInfoVO.getMenuUrl() != null) {
            menuInfoVO.setMenuUrl(menuInfoVO.getMenuUrl().trim());
        }

        if (!hasText(menuInfoVO.getUseAt())) {
            menuInfoVO.setUseAt("Y");
        }

        if (!hasText(menuInfoVO.getIconNm())) {
            menuInfoVO.setIconNm("Menu");
        }

        if (!hasText(menuInfoVO.getFrstRegisterId())) {
            menuInfoVO.setFrstRegisterId("system");
        }

        if (!hasText(menuInfoVO.getLastUpdusrId())) {
            menuInfoVO.setLastUpdusrId("system");
        }
    }

    private void normalizePayloadForPatch(MenuInfoVO menuInfoVO) {
        if (hasText(menuInfoVO.getMenuCode())) {
            menuInfoVO.setMenuCode(menuInfoVO.getMenuCode().trim().toUpperCase());
        }
        if (menuInfoVO.getMenuNm() != null) {
            menuInfoVO.setMenuNm(menuInfoVO.getMenuNm().trim());
        }
        if (menuInfoVO.getMenuDc() != null) {
            menuInfoVO.setMenuDc(menuInfoVO.getMenuDc().trim());
        }
        if (menuInfoVO.getMenuUrl() != null) {
            menuInfoVO.setMenuUrl(menuInfoVO.getMenuUrl().trim());
        }
        if (menuInfoVO.getUseAt() != null) {
            menuInfoVO.setUseAt(menuInfoVO.getUseAt().trim());
        }
        if (menuInfoVO.getIconNm() != null) {
            menuInfoVO.setIconNm(menuInfoVO.getIconNm().trim());
        }
        if (!hasText(menuInfoVO.getLastUpdusrId())) {
            menuInfoVO.setLastUpdusrId("system");
        }
    }

    private void validateForPatch(MenuInfoVO menuInfoVO, Long selfMenuId) throws Exception {
        if (hasText(menuInfoVO.getMenuCode())) {
            MenuInfoVO current = platformMenuService.getMenuDetail(selfMenuId);
            if (current != null && hasText(current.getMenuCode())) {
                String incomingCode = menuInfoVO.getMenuCode().trim().toUpperCase();
                String currentCode = current.getMenuCode().trim().toUpperCase();
                if (!incomingCode.equals(currentCode)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "메뉴 코드는 수정할 수 없습니다.");
                }
            }
        }

        Long parentMenuId = menuInfoVO.getParentMenuId();
        if (parentMenuId == null) {
            return;
        }

        if (selfMenuId.equals(parentMenuId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "상위 메뉴는 자기 자신으로 지정할 수 없습니다.");
        }

        MenuInfoVO parent = platformMenuService.getMenuDetail(parentMenuId);
        if (parent == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "상위 메뉴가 존재하지 않습니다.");
        }
    }

    private String normalizeNullable(String value) {
        if (!hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private void validatePage(int pageIndex, int pageSize) {
        if (pageIndex < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "pageIndex는 1 이상이어야 합니다.");
        }
        boolean allowed = false;
        for (int allowedPageSize : ALLOWED_PAGE_SIZES) {
            if (pageSize == allowedPageSize) {
                allowed = true;
                break;
            }
        }
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "pageSize는 10, 20, 50만 허용됩니다.");
        }
    }

    private void validateSearchField(String searchField) {
        if (!hasText(searchField)) {
            return;
        }
        String normalized = searchField.trim();
        if (!"menuNm".equals(normalized) && !"menuDc".equals(normalized) && !"menuUrl".equals(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "searchField 값이 유효하지 않습니다.");
        }
    }

    private void validateUseAt(String useAt) {
        if (!hasText(useAt)) {
            return;
        }
        String normalized = useAt.trim().toUpperCase();
        if (!"Y".equals(normalized) && !"N".equals(normalized) && !"ALL".equals(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "useAt 값이 유효하지 않습니다.");
        }
    }
}
