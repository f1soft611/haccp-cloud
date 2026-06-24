package egovframework.let.platforms.roles.service.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.annotation.Resource;

import org.egovframe.rte.ptl.mvc.tags.ui.pagination.PaginationInfo;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.let.platforms.roles.domain.repository.PlatformRoleDAO;
import egovframework.let.platforms.roles.service.PlatformRoleService;
import egovframework.let.platforms.roles.domain.model.PlatformRoleMenuSaveRequestVO;
import egovframework.let.uss.auth.service.RoleInfoVO;
import egovframework.let.uss.auth.service.MenuInfoVO;
import egovframework.let.uss.auth.service.RoleMenuPermissionVO;

/**
 * 플랫폼 역할 서비스 구현체
 * @author AI Assistant
 * @since 2026.06.22
 * @version 1.0
 */
@Service("platformRoleService")
public class PlatformRoleServiceImpl implements PlatformRoleService {

    private static final String DEFAULT_PERMISSION_ID = "PERM_WRITE";
    private static final String SYSTEM_USER_ID = "system";

    @Resource(name = "platformRoleDAO")
    private PlatformRoleDAO platformRoleDAO;

    @Override
    public List<RoleInfoVO> listRoles() throws Exception {
        return platformRoleDAO.selectRoleList();
    }

    @Override
    public ResultVO listRolesPaged(
            int pageIndex,
            int pageSize,
            String searchField,
            String searchKeyword,
            String useAt) throws Exception {
        RoleInfoVO condition = new RoleInfoVO();
        condition.setPageIndex(pageIndex);
        condition.setPageSize(pageSize);
        condition.setSearchField(hasText(searchField) ? searchField.trim() : "");
        condition.setSearchKeyword(hasText(searchKeyword) ? searchKeyword.trim() : "");
        condition.setUseAt(hasText(useAt) ? useAt.trim().toUpperCase() : "all");

        PaginationInfo paginationInfo = new PaginationInfo();
        paginationInfo.setCurrentPageNo(condition.getPageIndex());
        paginationInfo.setRecordCountPerPage(condition.getPageSize());
        paginationInfo.setPageSize(condition.getPageSize());

        condition.setFirstIndex(paginationInfo.getFirstRecordIndex());
        condition.setLastIndex(paginationInfo.getLastRecordIndex());
        condition.setRecordCountPerPage(paginationInfo.getRecordCountPerPage());

        List<RoleInfoVO> roleList = platformRoleDAO.selectRolePagedList(condition);
        int totalCount = platformRoleDAO.selectRolePagedCount(condition);
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

        if (!hasText(payload.getFrstRegisterId())) {
            payload.setFrstRegisterId(SYSTEM_USER_ID);
        }
        if (!hasText(payload.getLastUpdusrId())) {
            payload.setLastUpdusrId(SYSTEM_USER_ID);
        }

        platformRoleDAO.insertRole(payload);
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
        platformRoleDAO.updateRoleUseAt(payload);
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
        platformRoleDAO.updateRole(payload);
        return payload;
    }

    @Override
    public Map<String, Object> getRoleMenus(String roleCode) throws Exception {
        String normalizedRoleCode = toUpper(roleCode);
        if (!hasText(normalizedRoleCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "roleCode는 필수입니다.");
        }

        RoleMenuPermissionVO condition = new RoleMenuPermissionVO();
        condition.setRoleCode(normalizedRoleCode);
        List<RoleMenuPermissionVO> permissions = platformRoleDAO.selectRoleMenuPermissionList(condition);

        Set<String> menuCodeSet = new LinkedHashSet<String>();
        for (RoleMenuPermissionVO permission : permissions) {
            if (permission != null && hasText(permission.getMenuCode())) {
                menuCodeSet.add(toUpper(permission.getMenuCode()));
            }
        }

        Map<String, Object> response = new HashMap<String, Object>();
        response.put("roleCode", normalizedRoleCode);
        response.put("menuIds", new ArrayList<String>(menuCodeSet));
        return response;
    }

    @Override
    public Map<String, Object> replaceRoleMenus(String roleCode, PlatformRoleMenuSaveRequestVO payload) throws Exception {
        if (payload == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "요청 본문이 필요합니다.");
        }

        payload.setRoleCode(roleCode);
        payload.normalize();

        if (!hasText(payload.getRoleCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "roleCode는 필수입니다.");
        }

        platformRoleDAO.deleteRoleMenuPermissionsByRoleCode(payload.getRoleCode());

        for (String menuCode : payload.getMenuIds()) {
            RoleMenuPermissionVO item = new RoleMenuPermissionVO();
            item.setRoleCode(payload.getRoleCode());
            item.setMenuCode(menuCode);
            item.setPermissionCode(DEFAULT_PERMISSION_ID);
            item.setUseAt("Y");
            item.setFrstRegisterId(SYSTEM_USER_ID);
            item.setLastUpdusrId(SYSTEM_USER_ID);
            platformRoleDAO.insertRoleMenuPermission(item);
        }

        Map<String, Object> response = new HashMap<String, Object>();
        response.put("roleCode", payload.getRoleCode());
        response.put("menuIds", payload.getMenuIds());
        return response;
    }

    private String toUpper(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toUpperCase();
    }

    @Override
    public List<MenuInfoVO> listUserMenus(String roleCode) throws Exception {
        return platformRoleDAO.selectUserAccessibleMenus(roleCode);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
