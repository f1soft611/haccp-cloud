package egovframework.let.organization.authorities.service.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import javax.annotation.Resource;

import org.egovframe.rte.ptl.mvc.tags.ui.pagination.PaginationInfo;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.let.organization.authorities.domain.repository.AuthorityDAO;
import egovframework.let.organization.authorities.service.AuthorityService;
import egovframework.let.organization.authorities.domain.model.AuthorityMenuSaveRequestVO;
import egovframework.let.platform_admin.access.service.PlanAccessService;
import egovframework.let.uss.auth.service.RoleInfoVO;
import egovframework.let.uss.auth.service.MenuInfoVO;
import egovframework.let.uss.auth.service.RoleMenuPermissionVO;

/**
 * 플랫폼 역할 서비스 구현체
 * @author AI Assistant
 * @since 2026.06.22
 * @version 1.0
 */
@Service("authorityService")
public class AuthorityServiceImpl implements AuthorityService {

    private static final String DEFAULT_PERMISSION_ID = "PERM_WRITE";
    private static final String SYSTEM_USER_ID = "system";

    @Resource(name = "authorityDAO")
    private AuthorityDAO authorityDAO;

    @Resource(name = "planAccessService")
    private PlanAccessService planAccessService;

    @Override
    public List<RoleInfoVO> listRoles(String tenantCode) throws Exception {
        RoleInfoVO condition = new RoleInfoVO();
        if (hasText(tenantCode)) {
            condition.setTenantCode(tenantCode.trim().toUpperCase());
        }
        return authorityDAO.selectRoleList(condition);
    }

    @Override
    public ResultVO listRolesPaged(
            int pageIndex,
            int pageSize,
            String searchField,
            String searchKeyword,
            String tenantCode,
            String useAt) throws Exception {
        RoleInfoVO condition = new RoleInfoVO();
        condition.setPageIndex(pageIndex);
        condition.setPageSize(pageSize);
        condition.setSearchField(hasText(searchField) ? searchField.trim() : "");
        condition.setSearchKeyword(hasText(searchKeyword) ? searchKeyword.trim() : "");
        condition.setTenantCode(hasText(tenantCode) ? tenantCode.trim().toUpperCase() : "");
        condition.setUseAt(hasText(useAt) ? useAt.trim().toUpperCase() : "all");

        PaginationInfo paginationInfo = new PaginationInfo();
        paginationInfo.setCurrentPageNo(condition.getPageIndex());
        paginationInfo.setRecordCountPerPage(condition.getPageSize());
        paginationInfo.setPageSize(condition.getPageSize());

        condition.setFirstIndex(paginationInfo.getFirstRecordIndex());
        condition.setLastIndex(paginationInfo.getLastRecordIndex());
        condition.setRecordCountPerPage(paginationInfo.getRecordCountPerPage());

        List<RoleInfoVO> roleList = authorityDAO.selectRolePagedList(condition);
        int totalCount = authorityDAO.selectRolePagedCount(condition);
        paginationInfo.setTotalRecordCount(totalCount);

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("roleList", roleList);
        resultMap.put("totalCount", totalCount);
        resultMap.put("paginationInfo", paginationInfo);

        ResultVO resultVO = new ResultVO();
        resultVO.setResult(resultMap);
        resultVO.setResultCode(ResponseCode.SUCCESS.getCode());
        resultVO.setResultMessage(ResponseCode.SUCCESS.getMessage());
        return resultVO;
    }

    @Override
    public RoleInfoVO createRole(RoleInfoVO payload) throws Exception {
        if (payload == null || !hasText(payload.getRoleCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "역할 코드는 필수입니다.");
        }

        payload.setRoleCode(toUpper(payload.getRoleCode()));
        payload.setUseAt("Y");
        payload.setTenantCode(hasText(payload.getTenantCode()) ? toUpper(payload.getTenantCode()) : "PLATFORM");

        if (!hasText(payload.getFrstRegisterId())) {
            payload.setFrstRegisterId(SYSTEM_USER_ID);
        }
        if (!hasText(payload.getLastUpdusrId())) {
            payload.setLastUpdusrId(SYSTEM_USER_ID);
        }

        authorityDAO.insertRole(payload);
        return payload;
    }

    @Override
    public RoleInfoVO updateRoleUseAt(Long roleId, RoleInfoVO payload) throws Exception {
        if (payload == null || !hasText(payload.getUseAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "useAt 값은 필수입니다.");
        }

        payload.setRoleId(roleId);
        if (hasText(payload.getRoleCode())) {
            payload.setRoleCode(toUpper(payload.getRoleCode()));
        }
        payload.setUseAt(toUpper(payload.getUseAt()));

        if (!hasText(payload.getLastUpdusrId())) {
            payload.setLastUpdusrId(SYSTEM_USER_ID);
        }

        RoleInfoVO.validateUpdatePolicy(payload);
        authorityDAO.updateRoleUseAt(payload);
        return payload;
    }

    @Override
    public RoleInfoVO updateRole(Long roleId, RoleInfoVO payload) throws Exception {
        if (payload == null || !hasText(payload.getRoleNm())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "roleNm 값은 필수입니다.");
        }

        payload.setRoleId(roleId);
        if (hasText(payload.getRoleCode())) {
            payload.setRoleCode(toUpper(payload.getRoleCode()));
        }
        payload.setRoleNm(payload.getRoleNm().trim());
        payload.setUseAt(hasText(payload.getUseAt()) ? toUpper(payload.getUseAt()) : "Y");

        if (!hasText(payload.getLastUpdusrId())) {
            payload.setLastUpdusrId(SYSTEM_USER_ID);
        }

        RoleInfoVO.validateUpdatePolicy(payload);
        authorityDAO.updateRole(payload);
        return payload;
    }

    @Override
    public Map<String, Object> getRoleMenus(String roleCode, String tenantCode) throws Exception {
        String normalizedRoleCode = toUpper(roleCode);
        String normalizedTenantCode = hasText(tenantCode) ? toUpper(tenantCode) : "PLATFORM";
        if (!hasText(normalizedRoleCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "roleCode는 필수입니다.");
        }

        RoleMenuPermissionVO condition = new RoleMenuPermissionVO();
        condition.setRoleCode(normalizedRoleCode);
        condition.setTenantCode(normalizedTenantCode);
        List<RoleMenuPermissionVO> permissions = authorityDAO.selectRoleMenuPermissionList(condition);

        Set<String> menuCodeSet = new LinkedHashSet<String>();
        for (RoleMenuPermissionVO permission : permissions) {
            if (permission != null && hasText(permission.getMenuCode())) {
                menuCodeSet.add(toUpper(permission.getMenuCode()));
            }
        }

        Map<String, Object> response = new HashMap<String, Object>();
        response.put("roleCode", normalizedRoleCode);
        response.put("tenantCode", normalizedTenantCode);
        response.put("menuIds", new ArrayList<String>(menuCodeSet));
        return response;
    }

    @Override
    public Map<String, Object> replaceRoleMenus(String roleCode, String tenantCode, AuthorityMenuSaveRequestVO payload) throws Exception {
        if (payload == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "요청 본문이 필요합니다.");
        }

        payload.setRoleCode(roleCode);
        payload.normalize();

        if (!hasText(payload.getRoleCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "roleCode는 필수입니다.");
        }

        String normalizedTenantCode = hasText(tenantCode) ? toUpper(tenantCode) : "PLATFORM";
        List<String> allowedMenuCodes = listAllowedMenuCodesByTenantPlan(normalizedTenantCode);
        Set<String> allowedSet = new LinkedHashSet<String>(allowedMenuCodes);

        List<String> filteredMenuIds = payload.getMenuIds().stream()
                .filter(allowedSet::contains)
                .collect(Collectors.toList());

        Map<String, Object> deleteCondition = new HashMap<String, Object>();
        deleteCondition.put("roleCode", payload.getRoleCode());
        deleteCondition.put("tenantCode", normalizedTenantCode);

        authorityDAO.deleteRoleMenuPermissionsByRoleCode(deleteCondition);

        for (String menuCode : filteredMenuIds) {
            RoleMenuPermissionVO item = new RoleMenuPermissionVO();
            item.setRoleCode(payload.getRoleCode());
            item.setTenantCode(normalizedTenantCode);
            item.setMenuCode(menuCode);
            item.setPermissionCode(DEFAULT_PERMISSION_ID);
            item.setUseAt("Y");
            item.setFrstRegisterId(SYSTEM_USER_ID);
            item.setLastUpdusrId(SYSTEM_USER_ID);
            authorityDAO.insertRoleMenuPermission(item);
        }

        Map<String, Object> response = new HashMap<String, Object>();
        response.put("roleCode", payload.getRoleCode());
        response.put("tenantCode", normalizedTenantCode);
        response.put("menuIds", filteredMenuIds);
        return response;
    }

    @Override
    public List<String> listAllowedMenuCodesByTenantPlan(String tenantCode) throws Exception {
        String normalizedTenantCode = hasText(tenantCode) ? toUpper(tenantCode) : "PLATFORM";
        return planAccessService.resolveTenantPlanMenuCodes(normalizedTenantCode);
    }

    private String toUpper(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toUpperCase();
    }

    @Override
    public List<MenuInfoVO> listUserMenus(String roleCode) throws Exception {
        return authorityDAO.selectUserAccessibleMenus(roleCode);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
