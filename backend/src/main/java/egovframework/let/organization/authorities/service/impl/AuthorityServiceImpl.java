package egovframework.let.organization.authorities.service.impl;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import javax.annotation.Resource;

import org.egovframe.rte.fdl.cmmn.EgovAbstractServiceImpl;
import org.egovframe.rte.ptl.mvc.tags.ui.pagination.PaginationInfo;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import egovframework.let.organization.authorities.domain.repository.AuthorityDAO;
import egovframework.let.organization.authorities.service.AuthorityService;
import egovframework.let.organization.authorities.domain.model.AuthorityMenuSaveRequestVO;
import egovframework.let.platform_admin.access.service.PlanAccessService;
import egovframework.let.uss.auth.service.RoleInfoVO;
import egovframework.let.uss.auth.service.MenuInfoVO;
import egovframework.let.uss.auth.service.RoleMenuPermissionVO;

/**
 * 플랫폼 권한/역할 관리를 위한 서비스 구현 클래스
 * @author SHMT-MES
 * @since 2026.07.14
 * @version 1.0
 */
@Service("authorityService")
public class AuthorityServiceImpl extends EgovAbstractServiceImpl implements AuthorityService {

    private static final String DEFAULT_PERMISSION_ID = "PERM_WRITE";
    private static final String SYSTEM_USER_ID = "system";
            private static final Set<String> IMMUTABLE_SYSTEM_ROLE_CODES =
                new LinkedHashSet<String>(Arrays.asList("TENANT_ADMIN", "TENANT_USER", "TENENT_USER"));

    @Resource(name = "authorityDAO")
    private AuthorityDAO authorityDAO;

    @Resource(name = "planAccessService")
    private PlanAccessService planAccessService;

    @Override
    public List<RoleInfoVO> listRoles(String tenantCode) throws Exception {
        RoleInfoVO condition = new RoleInfoVO();
        if (hasText(tenantCode)) {
            String normalizedTenantCode = tenantCode.trim().toUpperCase();
            condition.setTenantCode(normalizedTenantCode);
            condition.setTenantId(planAccessService.resolveTenantIdByTenantCode(normalizedTenantCode));
        }
        return authorityDAO.selectRoleList(condition);
    }

    @Override
    public Map<String, Object> listRolesPaged(
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
        String normalizedTenantCode = hasText(tenantCode) ? tenantCode.trim().toUpperCase() : "";
        condition.setTenantCode(normalizedTenantCode);
        condition.setTenantId(hasText(normalizedTenantCode) ? planAccessService.resolveTenantIdByTenantCode(normalizedTenantCode) : null);
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
        return resultMap;
    }

    @Override
    public RoleInfoVO createRole(RoleInfoVO payload) throws Exception {
        if (payload == null || !hasText(payload.getRoleCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "역할 코드는 필수입니다.");
        }

        payload.setRoleCode(toUpper(payload.getRoleCode()));
        payload.setUseAt("Y");
        String normalizedTenantCode = hasText(payload.getTenantCode()) ? toUpper(payload.getTenantCode()) : "PLATFORM";
        payload.setTenantCode(normalizedTenantCode);

        Long resolvedTenantId = planAccessService.resolveTenantIdByTenantCode(normalizedTenantCode);
        if (resolvedTenantId == null || resolvedTenantId <= 0L) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 tenantId입니다. tenantCode=" + normalizedTenantCode);
        }
        payload.setTenantId(resolvedTenantId);
        payload.setSystemRoleYn(hasText(payload.getSystemRoleYn()) ? toUpper(payload.getSystemRoleYn()) : "N");

        if (authorityDAO.selectRoleIdByCode(normalizedTenantCode, payload.getRoleCode()) != null) {
            throw new IllegalArgumentException("이미 사용 중인 권한 코드입니다.");
        }

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

        RoleInfoVO persisted = authorityDAO.selectRoleById(roleId);
        if (persisted == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "역할을 찾을 수 없습니다.");
        }
        validateImmutableSystemRole(persisted);

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

        RoleInfoVO persisted = authorityDAO.selectRoleById(roleId);
        if (persisted == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "역할을 찾을 수 없습니다.");
        }
        validateImmutableSystemRole(persisted);

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
        Long roleId = parseLong(roleCode);
        String normalizedTenantCode = hasText(tenantCode) ? toUpper(tenantCode) : "PLATFORM";
        if (!hasText(normalizedRoleCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "roleCode는 필수입니다.");
        }

        RoleMenuPermissionVO condition = new RoleMenuPermissionVO();
        if (roleId != null) {
            condition.setRoleId(roleId);
        } else {
            condition.setRoleCode(normalizedRoleCode);
        }
        condition.setTenantCode(normalizedTenantCode);
        List<RoleMenuPermissionVO> permissions = authorityDAO.selectRoleMenuPermissionList(condition);

        Set<String> menuCodeSet = new LinkedHashSet<String>();
        for (RoleMenuPermissionVO permission : permissions) {
            if (permission != null && hasText(permission.getMenuCode())) {
                menuCodeSet.add(toUpper(permission.getMenuCode()));
            }
        }

        Map<String, Object> response = new HashMap<String, Object>();
        response.put("roleCode", roleId != null ? String.valueOf(roleId) : normalizedRoleCode);
        response.put("tenantCode", normalizedTenantCode);
        response.put("menuIds", new ArrayList<String>(menuCodeSet));
        return response;
    }

    @Override
    public Map<String, Object> replaceRoleMenus(String roleCode, String tenantCode, AuthorityMenuSaveRequestVO payload) throws Exception {
        if (payload == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "요청 본문이 필요합니다.");
        }

        ensureTenantPermissions(tenantCode);

        payload.setRoleCode(roleCode);
        payload.normalize();

        if (!hasText(payload.getRoleCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "roleCode는 필수입니다.");
        }

        Long roleId = parseLong(payload.getRoleCode());
        String normalizedRoleCode = toUpper(payload.getRoleCode());
        String normalizedTenantCode = hasText(tenantCode) ? toUpper(tenantCode) : "PLATFORM";
        if (roleId == null) {
            roleId = authorityDAO.selectRoleIdByCode(normalizedTenantCode, normalizedRoleCode);
        }
        if (roleId == null && ("TENANT_ADMIN".equals(normalizedRoleCode) || "TENANT_USER".equals(normalizedRoleCode))) {
            RoleInfoVO defaultRole = new RoleInfoVO();
            defaultRole.setTenantCode(normalizedTenantCode);
            defaultRole.setRoleCode(normalizedRoleCode);
            defaultRole.setRoleNm("TENANT_ADMIN".equals(normalizedRoleCode) ? "업체 관리자" : "업체 사용자");
            defaultRole.setUseAt("Y");
            defaultRole.setSystemRoleYn("Y");
            defaultRole.setFrstRegisterId(SYSTEM_USER_ID);
            defaultRole.setLastUpdusrId(SYSTEM_USER_ID);
            defaultRole.setTenantId(planAccessService.resolveTenantIdByTenantCode(normalizedTenantCode));
            authorityDAO.insertRole(defaultRole);
            roleId = authorityDAO.selectRoleIdByCode(normalizedTenantCode, normalizedRoleCode);
        }
        if (roleId == null && !"TENANT_ADMIN".equals(normalizedRoleCode) && !"TENANT_USER".equals(normalizedRoleCode)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "역할을 찾을 수 없습니다: " + normalizedRoleCode);
        }
        if (roleId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "역할을 찾을 수 없습니다: " + normalizedRoleCode);
        }
        List<String> allowedMenuCodes = listAllowedMenuCodesByTenantPlan(normalizedTenantCode);

        List<String> sourceMenuCodes = payload.getMenuIds();
        Set<String> validMenuSet = new LinkedHashSet<String>(allowedMenuCodes);

        if ("TENANT_ADMIN".equals(normalizedRoleCode)) {
            try {
                sourceMenuCodes = authorityDAO.selectAllMenuCodesByTenantCode(normalizedTenantCode);
            } catch (Exception ex) {
                sourceMenuCodes = payload.getMenuIds();
            }
            if (sourceMenuCodes == null || sourceMenuCodes.isEmpty()) {
                sourceMenuCodes = payload.getMenuIds();
            }
            validMenuSet = new LinkedHashSet<String>(sourceMenuCodes == null ? Collections.emptyList() : sourceMenuCodes);
        }

        final Set<String> finalValidMenuSet = new LinkedHashSet<String>(validMenuSet);
        final List<String> effectiveSourceMenuCodes = sourceMenuCodes == null ? Collections.emptyList() : sourceMenuCodes;
        List<String> filteredMenuIds = effectiveSourceMenuCodes.stream()
                .filter(code -> code != null && finalValidMenuSet.contains(code.trim().toUpperCase()))
                .collect(Collectors.toList());

        Map<String, Object> deleteCondition = new HashMap<String, Object>();
        if (roleId != null) {
            deleteCondition.put("roleId", roleId);
        } else {
            deleteCondition.put("roleCode", normalizedRoleCode);
        }
        deleteCondition.put("tenantCode", normalizedTenantCode);

        authorityDAO.deleteRoleMenuPermissionsByRoleCode(deleteCondition);

        for (String menuCode : filteredMenuIds) {
            Long menuId = authorityDAO.selectMenuIdByCode(menuCode);
            if (menuId == null) {
                continue;
            }

            RoleMenuPermissionVO item = new RoleMenuPermissionVO();
            if (roleId != null) {
                item.setRoleId(roleId);
            } else {
                Long resolvedRoleId = authorityDAO.selectRoleIdByCode(normalizedTenantCode, normalizedRoleCode);
                if (resolvedRoleId == null) {
                    throw new ResponseStatusException(HttpStatus.NOT_FOUND, "역할을 찾을 수 없습니다: " + normalizedRoleCode);
                }
                item.setRoleId(resolvedRoleId);
            }
            item.setTenantCode(normalizedTenantCode);
            item.setMenuId(menuId);
            item.setMenuCode(menuCode);
            item.setPermissionCode(DEFAULT_PERMISSION_ID);
            item.setUseAt("Y");
            item.setFrstRegisterId(SYSTEM_USER_ID);
            item.setLastUpdusrId(SYSTEM_USER_ID);
            authorityDAO.insertRoleMenuPermission(item);
        }

        Map<String, Object> response = new HashMap<String, Object>();
        response.put("roleCode", roleId != null ? String.valueOf(roleId) : normalizedRoleCode);
        response.put("tenantCode", normalizedTenantCode);
        response.put("menuIds", filteredMenuIds);
        return response;
    }

    private void ensureTenantPermissions(String tenantCode) throws Exception {
        if (!hasText(tenantCode)) {
            return;
        }

        Long tenantId = planAccessService.resolveTenantIdByTenantCode(tenantCode);
        if (tenantId == null) {
            return;
        }

        authorityDAO.upsertPermissionType(tenantId, "PERM_READ", "조회");
        authorityDAO.upsertPermissionType(tenantId, "PERM_WRITE", "등록/수정");
    }

    @Override
    public List<String> listRoleMenuCodes(String tenantCode, String roleCode) throws Exception {
        String normalizedTenantCode = hasText(tenantCode) ? toUpper(tenantCode) : "PLATFORM";
        String normalizedRoleCode = hasText(roleCode) ? toUpper(roleCode) : "";

        if ("TENANT_ADMIN".equals(normalizedRoleCode)) {
            try {
                List<String> tenantMenus = authorityDAO.selectAllMenuCodesByTenantCode(normalizedTenantCode);
                return tenantMenus == null ? Collections.emptyList() : tenantMenus;
            } catch (Exception ex) {
                return listAllowedMenuCodesByTenantPlan(normalizedTenantCode);
            }
        }

        return listAllowedMenuCodesByTenantPlan(normalizedTenantCode);
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
    public List<MenuInfoVO> listUserMenus(String loginId, Long tenantId) throws Exception {
        return authorityDAO.selectUserAccessibleMenus(loginId, tenantId);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private Long parseLong(String value) {
        if (!hasText(value)) {
            return null;
        }

        String trimmed = value.trim();
        for (int index = 0; index < trimmed.length(); index++) {
            if (!Character.isDigit(trimmed.charAt(index))) {
                return null;
            }
        }

        try {
            return Long.valueOf(trimmed);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private void validateImmutableSystemRole(RoleInfoVO roleInfo) {
        if (roleInfo == null) {
            return;
        }

        String systemRoleYn = toUpper(roleInfo.getSystemRoleYn());
        if ("Y".equals(systemRoleYn) || Boolean.TRUE.equals(roleInfo.getSystemRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "시스템 권한은 수정하거나 삭제할 수 없습니다.");
        }

        String normalizedRoleCode = toUpper(roleInfo.getRoleCode());
        if (IMMUTABLE_SYSTEM_ROLE_CODES.contains(normalizedRoleCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "시스템 권한은 수정하거나 삭제할 수 없습니다.");
        }
    }
}
