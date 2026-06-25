package egovframework.let.platforms.users.service.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.LinkedHashSet;
import java.util.Collections;

import javax.annotation.Resource;

import org.egovframe.rte.ptl.mvc.tags.ui.pagination.PaginationInfo;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.let.platforms.access.service.PlanAccessService;
import egovframework.let.platforms.users.domain.model.PlatformUserSaveRequestVO;
import egovframework.let.platforms.users.domain.model.PlatformUserSearchConditionVO;
import egovframework.let.platforms.users.domain.model.PlatformUserVO;
import egovframework.let.platforms.users.domain.repository.PlatformUserDAO;
import egovframework.let.platforms.users.service.PlatformUserService;
import egovframework.let.utl.sim.service.EgovFileScrty;

@Service("platformUserService")
public class PlatformUserServiceImpl implements PlatformUserService {

    private static final String USER_LIMIT_FEATURE_CODE = "LIMIT_USER_COUNT";
    private static final String DEFAULT_INITIAL_PASSWORD = "Welcome123!";

    @Resource(name = "platformUserDAO")
    private PlatformUserDAO platformUserDAO;

    @Resource(name = "planAccessService")
    private PlanAccessService planAccessService;

    @Override
    public List<PlatformUserVO> listUsers(String tenantCode) throws Exception {
        PlatformUserSearchConditionVO condition = new PlatformUserSearchConditionVO();
        condition.setTenantCode(normalizeTenantCode(tenantCode));
        return platformUserDAO.selectUserList(condition);
    }

    @Override
    public ResultVO listUsersPaged(int pageIndex, int pageSize, String keyword, String filterActive, String tenantCode) throws Exception {
        PlatformUserSearchConditionVO condition = new PlatformUserSearchConditionVO();
        condition.setPageIndex(pageIndex);
        condition.setPageSize(pageSize);
        condition.setSearchKeyword(normalizeNullable(keyword));
        condition.setFilterActive(normalizeFilterActive(filterActive));
        condition.setTenantCode(normalizeTenantCode(tenantCode));

        PaginationInfo paginationInfo = new PaginationInfo();
        paginationInfo.setCurrentPageNo(condition.getPageIndex());
        paginationInfo.setRecordCountPerPage(condition.getPageSize());
        paginationInfo.setPageSize(condition.getPageSize());

        condition.setFirstIndex(paginationInfo.getFirstRecordIndex());
        condition.setLastIndex(paginationInfo.getLastRecordIndex());
        condition.setRecordCountPerPage(paginationInfo.getRecordCountPerPage());

        List<PlatformUserVO> userList = platformUserDAO.selectUserPagedList(condition);
        int totalCount = platformUserDAO.selectUserPagedCount(condition);
        paginationInfo.setTotalRecordCount(totalCount);

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("userList", userList);
        resultMap.put("totalCount", totalCount);
        resultMap.put("paginationInfo", paginationInfo);

        ResultVO resultVO = new ResultVO();
        resultVO.setResultCode(ResponseCode.SUCCESS.getCode());
        resultVO.setResultMessage(ResponseCode.SUCCESS.getMessage());
        resultVO.setResult(resultMap);
        return resultVO;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PlatformUserVO createUser(PlatformUserSaveRequestVO payload) throws Exception {
        validatePayload(payload);
        Long tenantId = resolveTenantIdOrThrow(payload);
        ensureWithinUserLimit(tenantId);

        Long departmentId = findOrCreateDepartment(tenantId, payload.getDepartment());
        String loginCode = buildUniqueLoginCode(tenantId, payload.getEmail());
        String passwordHash = EgovFileScrty.encryptPassword(DEFAULT_INITIAL_PASSWORD, loginCode);

        Map<String, Object> loginPayload = new HashMap<String, Object>();
        loginPayload.put("tenantId", tenantId);
        loginPayload.put("loginCode", loginCode);
        loginPayload.put("passwordHash", passwordHash);
        loginPayload.put("useAt", toUseAt(payload.getActive(), true));
        platformUserDAO.insertLoginAccount(loginPayload);

        Long loginId = platformUserDAO.selectLoginIdByLoginCode(loginPayload);
        if (loginId == null) {
            throw new IllegalStateException("로그인 계정을 생성할 수 없습니다.");
        }

        Map<String, Object> userPayload = new HashMap<String, Object>();
        userPayload.put("tenantId", tenantId);
        userPayload.put("loginId", loginId);
        userPayload.put("userNm", trim(payload.getName()));
        userPayload.put("emailAddr", trim(payload.getEmail()));
        userPayload.put("departmentId", departmentId);
        userPayload.put("useAt", toUseAt(payload.getActive(), true));
        platformUserDAO.insertUser(userPayload);

        replaceRoleMappings(tenantId, loginId, resolveRoleCodes(payload));
        Long userId = resolveUserIdByLoginId(tenantId, loginId);
        if (userId == null) {
            throw new IllegalStateException("사용자를 생성할 수 없습니다.");
        }
        return getUserById(tenantId, userId, payload.getTenantCode());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PlatformUserVO updateUser(Long userId, PlatformUserSaveRequestVO payload) throws Exception {
        validatePayload(payload);
        Long tenantId = resolveTenantIdOrThrow(payload);
        Long loginId = resolveLoginId(tenantId, userId);

        Long departmentId = findOrCreateDepartment(tenantId, payload.getDepartment());
        Map<String, Object> updatePayload = new HashMap<String, Object>();
        updatePayload.put("tenantId", tenantId);
        updatePayload.put("userId", userId);
        updatePayload.put("userNm", trim(payload.getName()));
        updatePayload.put("emailAddr", trim(payload.getEmail()));
        updatePayload.put("departmentId", departmentId);
        updatePayload.put("useAt", toUseAt(payload.getActive(), null));
        platformUserDAO.updateUser(updatePayload);

        if (payload.getActive() != null) {
            Map<String, Object> statusPayload = new HashMap<String, Object>();
            statusPayload.put("loginId", loginId);
            statusPayload.put("useAt", toUseAt(payload.getActive(), true));
            platformUserDAO.updateUserStatus(statusPayload);
        }

        replaceRoleMappings(tenantId, loginId, resolveRoleCodes(payload));
        return getUserById(tenantId, userId, payload.getTenantCode());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PlatformUserVO updateUserActive(Long userId, PlatformUserSaveRequestVO payload) throws Exception {
        if (userId == null) {
            throw new IllegalArgumentException("user id is required");
        }

        Long tenantId = resolveTenantIdOrThrow(payload);
        Long loginId = resolveLoginId(tenantId, userId);
        String useAt = Boolean.TRUE.equals(payload.getActive()) ? "Y" : "N";

        Map<String, Object> updatePayload = new HashMap<String, Object>();
        updatePayload.put("tenantId", tenantId);
        updatePayload.put("userId", userId);
        updatePayload.put("useAt", useAt);
        platformUserDAO.updateUserStatus(updatePayload);

        Map<String, Object> loginStatusPayload = new HashMap<String, Object>();
        loginStatusPayload.put("loginId", loginId);
        loginStatusPayload.put("useAt", useAt);
        platformUserDAO.updateUserStatus(loginStatusPayload);

        return getUserById(tenantId, userId, payload.getTenantCode());
    }

    @Override
    public Long resolveTenantIdByCode(String tenantCode) {
        return planAccessService.resolveTenantIdByTenantCode(normalizeTenantCode(tenantCode));
    }

    private PlatformUserVO getUserById(Long tenantId, Long userId, String tenantCode) throws Exception {
        Map<String, Object> condition = new HashMap<String, Object>();
        condition.put("tenantId", tenantId);
        condition.put("userId", userId);
        PlatformUserVO user = platformUserDAO.selectUserDetail(condition);
        if (user == null) {
            throw new IllegalStateException("저장 후 사용자 조회에 실패했습니다.");
        }
        user.setTenantCode(normalizeTenantCode(tenantCode));
        return user;
    }

    private Long resolveTenantIdOrThrow(PlatformUserSaveRequestVO payload) throws Exception {
        Long tenantId = platformUserDAO.selectTenantIdByCode(normalizeTenantCode(payload.getTenantCode()));
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "tenantCode를 확인할 수 없습니다.");
        }
        return tenantId;
    }

    private Long resolveLoginId(Long tenantId, Long userId) throws Exception {
        Map<String, Object> condition = new HashMap<String, Object>();
        condition.put("tenantId", tenantId);
        condition.put("userId", userId);
        Long loginId = platformUserDAO.selectLoginIdByUserId(condition);
        if (loginId == null) {
            throw new IllegalStateException("연결된 로그인 계정을 찾을 수 없습니다.");
        }
        return loginId;
    }

    private Long resolveUserIdByLoginId(Long tenantId, Long loginId) throws Exception {
        Map<String, Object> condition = new HashMap<String, Object>();
        condition.put("tenantId", tenantId);
        condition.put("loginId", loginId);
        return platformUserDAO.selectUserIdByLoginId(condition);
    }

    private void ensureWithinUserLimit(Long tenantId) {
        if (tenantId == null) {
            throw new IllegalArgumentException("tenant is required");
        }
        if (!planAccessService.isWithinLimit(tenantId, USER_LIMIT_FEATURE_CODE)) {
            throw new IllegalStateException("플랜 사용자 수 제한을 초과했습니다.");
        }
    }

    private Long findOrCreateDepartment(Long tenantId, String departmentName) throws Exception {
        String normalizedDepartmentName = trim(departmentName);
        Map<String, Object> condition = new HashMap<String, Object>();
        condition.put("tenantId", tenantId);
        condition.put("departmentNm", normalizedDepartmentName);

        Long departmentId = platformUserDAO.selectDepartmentId(condition);
        if (departmentId != null) {
            return departmentId;
        }

        platformUserDAO.insertDepartment(condition);
        departmentId = platformUserDAO.selectDepartmentId(condition);
        if (departmentId == null) {
            throw new IllegalStateException("부서를 생성할 수 없습니다.");
        }
        return departmentId;
    }

    private String buildUniqueLoginCode(Long tenantId, String email) throws Exception {
        String localPart = trim(email);
        int atIndex = localPart.indexOf('@');
        if (atIndex > 0) {
            localPart = localPart.substring(0, atIndex);
        }

        String base = localPart.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9._-]", "");
        if (!StringUtils.hasText(base)) {
            base = "user";
        }

        String candidate = base;
        int suffix = 0;
        while (true) {
            Map<String, Object> condition = new HashMap<String, Object>();
            condition.put("tenantId", tenantId);
            condition.put("loginCode", candidate);
            Long loginId = platformUserDAO.selectLoginIdByLoginCode(condition);
            if (loginId == null) {
                return candidate;
            }
            suffix++;
            candidate = base + suffix;
        }
    }

    private void validatePayload(PlatformUserSaveRequestVO payload) {
        if (payload == null) {
            throw new IllegalArgumentException("요청 본문이 필요합니다.");
        }
        if (!StringUtils.hasText(payload.getName())) {
            throw new IllegalArgumentException("이름은 필수입니다.");
        }
        if (!StringUtils.hasText(payload.getEmail())) {
            throw new IllegalArgumentException("이메일은 필수입니다.");
        }
        if (!StringUtils.hasText(payload.getDepartment())) {
            throw new IllegalArgumentException("부서는 필수입니다.");
        }
        if (resolveRoleCodes(payload).isEmpty()) {
            throw new IllegalArgumentException("최소 1개 roleCode가 필요합니다.");
        }
    }

    private List<String> resolveRoleCodes(PlatformUserSaveRequestVO payload) {
        List<String> roleCodes = new ArrayList<String>();
        if (payload.getRoleCodes() != null) {
            for (String code : payload.getRoleCodes()) {
                if (StringUtils.hasText(code)) {
                    roleCodes.add(code.trim().toUpperCase(Locale.ROOT));
                }
            }
        }
        if (StringUtils.hasText(payload.getRoleCode())) {
            roleCodes.add(payload.getRoleCode().trim().toUpperCase(Locale.ROOT));
        }

        Set<String> deduped = new LinkedHashSet<String>(roleCodes);
        return new ArrayList<String>(deduped);
    }

    private void replaceRoleMappings(Long tenantId, Long loginId, List<String> roleCodes) throws Exception {
        if (loginId == null) {
            throw new IllegalArgumentException("login account is required");
        }

        platformUserDAO.deleteLoginAccountRolesByLoginId(loginId);
        for (String roleCode : roleCodes) {
            Map<String, Object> condition = new HashMap<String, Object>();
            condition.put("tenantId", tenantId);
            condition.put("roleCode", roleCode);
            Long roleId = platformUserDAO.selectRoleIdByCode(condition);
            if (roleId == null) {
                continue;
            }

            Map<String, Object> payload = new HashMap<String, Object>();
            payload.put("loginId", loginId);
            payload.put("roleId", roleId);
            platformUserDAO.insertLoginAccountRole(payload);
        }
    }

    private String normalizeTenantCode(String tenantCode) {
        if (!StringUtils.hasText(tenantCode)) {
            return "PLATFORM";
        }
        return tenantCode.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeFilterActive(String filterActive) {
        if (!StringUtils.hasText(filterActive)) {
            return "all";
        }
        return filterActive.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeNullable(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private String toUseAt(Boolean active, Boolean defaultActive) {
        boolean value;
        if (active != null) {
            value = active.booleanValue();
        } else if (defaultActive != null) {
            value = defaultActive.booleanValue();
        } else {
            value = true;
        }
        return value ? "Y" : "N";
    }
}
