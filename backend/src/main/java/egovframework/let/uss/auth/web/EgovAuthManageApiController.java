package egovframework.let.uss.auth.web;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.let.uss.auth.service.EgovAuthManageService;
import egovframework.let.uss.auth.service.MenuInfoVO;
import egovframework.let.uss.auth.service.PermissionTypeVO;
import egovframework.let.uss.auth.service.RoleMenuPermissionVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * 권한 관리 REST API 컨트롤러
 * @author SHMT-MES
 * @since 2024.01.01
 * @version 1.0
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin")
@Tag(name = "EgovAuthManageApiController", description = "권한 관리")
public class EgovAuthManageApiController {

    @Resource(name = "authManageService")
    private EgovAuthManageService authManageService;

    @Resource(name = "resultVoHelper")
    private ResultVoHelper resultVoHelper;

    /**
     * 메뉴 목록 조회
     */
    @Operation(
        summary = "메뉴 목록 조회", 
        description = "메뉴 목록을 조회한다.",
        security = {@SecurityRequirement(name = "Authorization")}
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "403", description = "인가된 사용자가 아님")
    })
    @GetMapping("/menus")
    public ResultVO selectMenuList(
        @Parameter(description = "메뉴명") @RequestParam(required = false) String menuNm,
        @Parameter(description = "상위메뉴ID") @RequestParam(required = false) String parentMenuId) throws Exception {
        
        MenuInfoVO menuInfoVO = new MenuInfoVO();
        menuInfoVO.setMenuNm(menuNm);
        menuInfoVO.setParentMenuId(parentMenuId);
        
        List<MenuInfoVO> resultList = authManageService.selectMenuList(menuInfoVO);
        
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("menuList", resultList);
        resultMap.put("resultMsg", "success.common.select");
        
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    /**
     * 메뉴 상세 조회
     */
    @Operation(
        summary = "메뉴 상세 조회", 
        description = "메뉴 상세 정보를 조회한다.",
        security = {@SecurityRequirement(name = "Authorization")}
    )
    @GetMapping("/menus/{menuId}")
    public ResultVO selectMenuDetail(@PathVariable String menuId) throws Exception {
        
        MenuInfoVO menuInfoVO = new MenuInfoVO();
        menuInfoVO.setMenuId(menuId);
        
        MenuInfoVO result = authManageService.selectMenuDetail(menuInfoVO);
        
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("menuInfo", result);
        resultMap.put("resultMsg", "success.common.select");
        
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    /**
     * 메뉴 등록
     */
    @Operation(
        summary = "메뉴 등록", 
        description = "새로운 메뉴를 등록한다.",
        security = {@SecurityRequirement(name = "Authorization")}
    )
    @PostMapping("/menus")
    public ResultVO insertMenu(@RequestBody MenuInfoVO menuInfoVO) throws Exception {
        
        authManageService.insertMenu(menuInfoVO);
        
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("resultMsg", "success.common.insert");
        
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    /**
     * 메뉴 수정
     */
    @Operation(
        summary = "메뉴 수정", 
        description = "메뉴 정보를 수정한다.",
        security = {@SecurityRequirement(name = "Authorization")}
    )
    @PutMapping("/menus/{menuId}")
    public ResultVO updateMenu(@PathVariable String menuId, @RequestBody MenuInfoVO menuInfoVO) throws Exception {
        
        menuInfoVO.setMenuId(menuId);
        authManageService.updateMenu(menuInfoVO);
        
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("resultMsg", "success.common.update");
        
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    /**
     * 메뉴 삭제
     */
    @Operation(
        summary = "메뉴 삭제", 
        description = "메뉴를 삭제한다.",
        security = {@SecurityRequirement(name = "Authorization")}
    )
    @DeleteMapping("/menus/{menuId}")
    public ResultVO deleteMenu(@PathVariable String menuId) throws Exception {
        
        MenuInfoVO menuInfoVO = new MenuInfoVO();
        menuInfoVO.setMenuId(menuId);
        
        authManageService.deleteMenu(menuInfoVO);
        
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("resultMsg", "success.common.delete");
        
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    /**
     * 권한 유형 목록 조회
     */
    @Operation(
        summary = "권한 유형 목록 조회", 
        description = "권한 유형 목록을 조회한다.",
        security = {@SecurityRequirement(name = "Authorization")}
    )
    @GetMapping("/permissions")
    public ResultVO selectPermissionTypeList(
        @Parameter(description = "권한명") @RequestParam(required = false) String permissionNm,
        @Parameter(description = "권한레벨") @RequestParam(required = false) String permissionLevel) throws Exception {
        
        PermissionTypeVO permissionTypeVO = new PermissionTypeVO();
        permissionTypeVO.setPermissionNm(permissionNm);
        permissionTypeVO.setPermissionLevel(permissionLevel);
        
        List<PermissionTypeVO> resultList = authManageService.selectPermissionTypeList(permissionTypeVO);
        
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("permissionList", resultList);
        resultMap.put("resultMsg", "success.common.select");
        
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    /**
     * 권한 유형 등록
     */
    @Operation(
        summary = "권한 유형 등록", 
        description = "새로운 권한 유형을 등록한다.",
        security = {@SecurityRequirement(name = "Authorization")}
    )
    @PostMapping("/permissions")
    public ResultVO insertPermissionType(@RequestBody PermissionTypeVO permissionTypeVO) throws Exception {
        
        authManageService.insertPermissionType(permissionTypeVO);
        
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("resultMsg", "success.common.insert");
        
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    /**
     * 역할별 메뉴 권한 목록 조회
     */
    @Operation(
        summary = "역할별 메뉴 권한 목록 조회", 
        description = "역할별 메뉴 권한 목록을 조회한다.",
        security = {@SecurityRequirement(name = "Authorization")}
    )
    @GetMapping("/role-permissions")
    public ResultVO selectRoleMenuPermissionList(
        @Parameter(description = "그룹ID") @RequestParam(required = false) String groupId,
        @Parameter(description = "메뉴ID") @RequestParam(required = false) String menuId) throws Exception {
        
        RoleMenuPermissionVO roleMenuPermissionVO = new RoleMenuPermissionVO();
        roleMenuPermissionVO.setGroupId(groupId);
        roleMenuPermissionVO.setMenuId(menuId);
        
        List<RoleMenuPermissionVO> resultList = authManageService.selectRoleMenuPermissionList(roleMenuPermissionVO);
        
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("rolePermissionList", resultList);
        resultMap.put("resultMsg", "success.common.select");
        
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    /**
     * 역할별 메뉴 권한 설정
     */
    @Operation(
        summary = "역할별 메뉴 권한 설정", 
        description = "역할별 메뉴 권한을 설정한다.",
        security = {@SecurityRequirement(name = "Authorization")}
    )
    @PostMapping("/role-permissions")
    public ResultVO insertRoleMenuPermission(@RequestBody RoleMenuPermissionVO roleMenuPermissionVO) throws Exception {
        
        authManageService.insertRoleMenuPermission(roleMenuPermissionVO);
        
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("resultMsg", "success.common.insert");
        
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    /**
     * 역할별 메뉴 권한 삭제
     */
    @Operation(
        summary = "역할별 메뉴 권한 삭제", 
        description = "역할별 메뉴 권한을 삭제한다.",
        security = {@SecurityRequirement(name = "Authorization")}
    )
    @DeleteMapping("/role-permissions")
    public ResultVO deleteRoleMenuPermission(
        @Parameter(description = "그룹ID") @RequestParam String groupId,
        @Parameter(description = "메뉴ID") @RequestParam String menuId,
        @Parameter(description = "권한ID") @RequestParam(required = false) String permissionId) throws Exception {
        
        RoleMenuPermissionVO roleMenuPermissionVO = new RoleMenuPermissionVO();
        roleMenuPermissionVO.setGroupId(groupId);
        roleMenuPermissionVO.setMenuId(menuId);
        roleMenuPermissionVO.setPermissionId(permissionId);
        
        authManageService.deleteRoleMenuPermission(roleMenuPermissionVO);
        
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("resultMsg", "success.common.delete");
        
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    /**
     * 사용자별 접근 가능한 메뉴 목록 조회
     */
    @Operation(
        summary = "사용자별 접근 가능한 메뉴 목록 조회", 
        description = "사용자별 접근 가능한 메뉴 목록을 조회한다.",
        security = {@SecurityRequirement(name = "Authorization")}
    )
    @GetMapping("/user-menus/{groupId}")
    public ResultVO selectUserAccessibleMenus(@PathVariable String groupId) throws Exception {
        
        List<MenuInfoVO> resultList = authManageService.selectUserAccessibleMenus(groupId);
        
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("menuList", resultList);
        resultMap.put("resultMsg", "success.common.select");
        
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    /**
     * 특정 메뉴에 대한 사용자 권한 확인
     */
    @Operation(
        summary = "특정 메뉴에 대한 사용자 권한 확인", 
        description = "특정 메뉴에 대한 사용자 권한을 확인한다.",
        security = {@SecurityRequirement(name = "Authorization")}
    )
    @GetMapping("/user-permissions/{groupId}")
    public ResultVO checkUserMenuPermission(
        @PathVariable String groupId,
        @Parameter(description = "메뉴URL") @RequestParam String menuUrl) throws Exception {
        
        String permission = authManageService.checkUserMenuPermission(groupId, menuUrl);
        
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("permission", permission);
        resultMap.put("resultMsg", "success.common.select");
        
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }
}