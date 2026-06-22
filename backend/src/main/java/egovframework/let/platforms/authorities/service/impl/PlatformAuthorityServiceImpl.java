package egovframework.let.platforms.authorities.service.impl;

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
import egovframework.let.platforms.authorities.domain.repository.PlatformAuthorityDAO;
import egovframework.let.platforms.authorities.service.PlatformAuthorityService;
import egovframework.let.platforms.authorities.domain.model.PlatformRoleMenuSaveRequestVO;
import egovframework.let.uss.auth.service.AuthorityInfoVO;
import egovframework.let.uss.auth.service.MenuInfoVO;
import egovframework.let.uss.auth.service.RoleMenuPermissionVO;

/**
 * 플랫폼 권한 서비스 구현체
 * @author AI Assistant
 * @since 2026.06.22
 * @version 1.0
 */
@Service("platformAuthorityService")
public class PlatformAuthorityServiceImpl implements PlatformAuthorityService {

    private static final String DEFAULT_PERMISSION_ID = "PERM_WRITE";
    private static final String SYSTEM_USER_ID = "system";

    @Resource(name = "platformAuthorityDAO")
    private PlatformAuthorityDAO platformAuthorityDAO;

    @Override
    public List<AuthorityInfoVO> listRoles() throws Exception {
        return platformAuthorityDAO.selectAuthorityList();
    }

    @Override
    public ResultVO listRolesPaged(
            int pageIndex,
            int pageSize,
            String searchField,
            String searchKeyword,
            String useAt) throws Exception {
        AuthorityInfoVO condition = new AuthorityInfoVO();
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

        List<AuthorityInfoVO> roleList = platformAuthorityDAO.selectAuthorityPagedList(condition);
        int totalCount = platformAuthorityDAO.selectAuthorityPagedCount(condition);
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
    public AuthorityInfoVO createRole(AuthorityInfoVO payload) throws Exception {
        if (payload == null || !hasText(payload.getAuthorityCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "권한 코드는 필수입니다.");
        }

        payload.setAuthorityCode(toUpper(payload.getAuthorityCode()));
        payload.setUseAt("Y");

        if (!hasText(payload.getFrstRegisterId())) {
            payload.setFrstRegisterId(SYSTEM_USER_ID);
        }
        if (!hasText(payload.getLastUpdusrId())) {
            payload.setLastUpdusrId(SYSTEM_USER_ID);
        }

        platformAuthorityDAO.insertAuthority(payload);
        return payload;
    }

    @Override
    public AuthorityInfoVO updateRoleUseAt(String code, AuthorityInfoVO payload) throws Exception {
        if (payload == null || !hasText(payload.getUseAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "useAt 값은 필수입니다.");
        }

        payload.setAuthorityCode(toUpper(code));
        payload.setUseAt(toUpper(payload.getUseAt()));

        if (!hasText(payload.getLastUpdusrId())) {
            payload.setLastUpdusrId(SYSTEM_USER_ID);
        }

        AuthorityInfoVO.validateUpdatePolicy(payload);
        platformAuthorityDAO.updateAuthorityUseAt(payload);
        return payload;
    }

    @Override
    public AuthorityInfoVO updateRole(String code, AuthorityInfoVO payload) throws Exception {
        if (payload == null || !hasText(payload.getAuthorityNm())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "authorityNm 값은 필수입니다.");
        }

        payload.setAuthorityCode(toUpper(code));
        payload.setAuthorityNm(payload.getAuthorityNm().trim());
        payload.setUseAt(hasText(payload.getUseAt()) ? toUpper(payload.getUseAt()) : "Y");

        if (!hasText(payload.getLastUpdusrId())) {
            payload.setLastUpdusrId(SYSTEM_USER_ID);
        }

        AuthorityInfoVO.validateUpdatePolicy(payload);
        platformAuthorityDAO.updateAuthority(payload);
        return payload;
    }

    @Override
    public Map<String, Object> getRoleMenus(String roleCode) throws Exception {
        String normalizedRoleCode = toUpper(roleCode);
        if (!hasText(normalizedRoleCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "roleCode는 필수입니다.");
        }

        RoleMenuPermissionVO condition = new RoleMenuPermissionVO();
        condition.setAuthorityCode(normalizedRoleCode);
        List<RoleMenuPermissionVO> permissions = platformAuthorityDAO.selectRoleMenuPermissionList(condition);

        Set<String> menuIdSet = new LinkedHashSet<String>();
        for (RoleMenuPermissionVO permission : permissions) {
            if (permission != null && hasText(permission.getMenuId())) {
                menuIdSet.add(toUpper(permission.getMenuId()));
            }
        }

        Map<String, Object> response = new HashMap<String, Object>();
        response.put("roleCode", normalizedRoleCode);
        response.put("menuIds", new ArrayList<String>(menuIdSet));
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

        platformAuthorityDAO.deleteRoleMenuPermissionsByAuthority(payload.getRoleCode());

        for (String menuId : payload.getMenuIds()) {
            RoleMenuPermissionVO item = new RoleMenuPermissionVO();
            item.setAuthorityCode(payload.getRoleCode());
            item.setMenuId(menuId);
            item.setPermissionId(DEFAULT_PERMISSION_ID);
            item.setUseAt("Y");
            item.setFrstRegisterId(SYSTEM_USER_ID);
            item.setLastUpdusrId(SYSTEM_USER_ID);
            platformAuthorityDAO.insertRoleMenuPermission(item);
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
    public List<MenuInfoVO> listUserMenus(String authorityCode) throws Exception {
        return platformAuthorityDAO.selectUserAccessibleMenus(authorityCode);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
