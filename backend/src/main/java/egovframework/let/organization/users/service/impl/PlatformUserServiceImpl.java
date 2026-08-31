package egovframework.let.organization.users.service.impl;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import javax.annotation.Resource;

import org.egovframe.rte.fdl.cmmn.EgovAbstractServiceImpl;
import org.egovframe.rte.ptl.mvc.tags.ui.pagination.PaginationInfo;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import egovframework.let.platform_admin.access.service.PlanAccessService;
import egovframework.let.platform_admin.tenants.context.TenantContextHolder;
import egovframework.let.organization.users.domain.model.PlatformUserImageUpdateRequestVO;
import egovframework.let.organization.users.domain.model.PlatformUserPasswordChangeRequestVO;
import egovframework.let.organization.users.domain.model.PlatformUserSaveRequestVO;
import egovframework.let.organization.users.domain.model.PlatformUserSearchConditionVO;
import egovframework.let.organization.users.domain.model.PlatformUserVO;
import egovframework.let.organization.users.domain.repository.PlatformUserDAO;
import egovframework.let.organization.users.service.PlatformUserService;
import egovframework.let.utl.sim.service.EgovFileScrty;

/**
 * 플랫폼 사용자 관리를 위한 서비스 구현 클래스
 * @author SHMT-MES
 * @since 2026.07.14
 * @version 1.0
 */
@Service("platformUserService")
public class PlatformUserServiceImpl extends EgovAbstractServiceImpl implements PlatformUserService {

    private static final String USER_LIMIT_FEATURE_CODE = "LIMIT_USER_COUNT";
    private static final String DEFAULT_INITIAL_PASSWORD = "Welcome123!";

    @Resource(name = "platformUserDAO")
    private PlatformUserDAO platformUserDAO;

    @Resource(name = "planAccessService")
    private PlanAccessService planAccessService;

    @Override
    public List<PlatformUserVO> listUsers(String tenantCode) throws Exception {
        PlatformUserSearchConditionVO condition = new PlatformUserSearchConditionVO();
        condition.setTenantId(resolveTenantIdOrContext(tenantCode));
        condition.setTenantCode(normalizeTenantCode(tenantCode));
        return platformUserDAO.selectUserList(condition);
    }

    @Override
    public Map<String, Object> listUsersPaged(int pageIndex, int pageSize, String keyword, String filterActive, String tenantCode) throws Exception {
        PlatformUserSearchConditionVO condition = new PlatformUserSearchConditionVO();
        condition.setPageIndex(pageIndex);
        condition.setPageSize(pageSize);
        condition.setKeyword(normalizeNullable(keyword));
        condition.setFilterActive(normalizeFilterActive(filterActive));
        condition.setTenantId(resolveTenantIdOrContext(tenantCode));
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
        return resultMap;
    }

    @Override
    public PlatformUserVO getMyPageUser(String tenantCode, String loginCode) throws Exception {
        String normalizedTenantCode = normalizeTenantCode(tenantCode);
        String normalizedLoginCode = normalizeNullable(loginCode);

        if (!StringUtils.hasText(normalizedLoginCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "로그인 정보를 확인할 수 없습니다.");
        }

        Map<String, Object> condition = new HashMap<String, Object>();
        Long tenantId = resolveTenantIdOrContext(normalizedTenantCode);
        condition.put("tenantId", tenantId);
        condition.put("tenantCode", normalizedTenantCode);
        condition.put("loginCode", normalizedLoginCode);

        PlatformUserVO user = platformUserDAO.selectUserByTenantCodeAndLoginCode(condition);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자 정보를 찾을 수 없습니다.");
        }

        user.setTenantCode(normalizedTenantCode);
        return user;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void changeMyPassword(String tenantCode, String loginCode, PlatformUserPasswordChangeRequestVO payload) throws Exception {
        validatePasswordChangePayload(payload);

        String normalizedTenantCode = normalizeTenantCode(tenantCode);
        String normalizedLoginCode = normalizeNullable(loginCode);
        if (!StringUtils.hasText(normalizedLoginCode)) {
            throw new IllegalArgumentException("로그인 정보를 확인할 수 없습니다.");
        }
        if (payload.getNewPassword().toLowerCase(Locale.ROOT).contains(normalizedLoginCode.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("비밀번호에 아이디를 포함할 수 없습니다.");
        }

        Map<String, Object> condition = new HashMap<String, Object>();
        Long tenantId = resolveTenantIdOrContext(normalizedTenantCode);
        condition.put("tenantId", tenantId);
        condition.put("tenantCode", normalizedTenantCode);
        condition.put("loginCode", normalizedLoginCode);

        Map<String, Object> account = platformUserDAO.selectLoginAccountForPasswordChange(condition);
        if (account == null || account.get("loginId") == null) {
            throw new IllegalStateException("사용자 계정을 찾을 수 없습니다.");
        }

        String storedPasswordHash = normalizeNullable(String.valueOf(account.get("passwordHash")));
        String encryptedCurrentPassword = EgovFileScrty.encryptPassword(payload.getCurrentPassword(), normalizedLoginCode);
        if (!StringUtils.hasText(storedPasswordHash) || !storedPasswordHash.equals(encryptedCurrentPassword)) {
            throw new IllegalStateException("현재 비밀번호가 일치하지 않습니다.");
        }

        String encryptedNewPassword = EgovFileScrty.encryptPassword(payload.getNewPassword(), normalizedLoginCode);
        if (encryptedCurrentPassword.equals(encryptedNewPassword)) {
            throw new IllegalArgumentException("현재 비밀번호와 다른 새 비밀번호를 입력해주세요.");
        }

        Map<String, Object> updatePayload = new HashMap<String, Object>();
        updatePayload.put("loginId", account.get("loginId"));
        updatePayload.put("passwordHash", encryptedNewPassword);
        platformUserDAO.updateLoginPasswordHash(updatePayload);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PlatformUserVO changeMyImages(String tenantCode, String loginCode, PlatformUserImageUpdateRequestVO payload) throws Exception {
        validateImageChangePayload(payload);

        String normalizedTenantCode = normalizeTenantCode(tenantCode);
        String normalizedLoginCode = normalizeNullable(loginCode);
        if (!StringUtils.hasText(normalizedLoginCode)) {
            throw new IllegalArgumentException("로그인 정보를 확인할 수 없습니다.");
        }

        Map<String, Object> condition = new HashMap<String, Object>();
        Long tenantId = resolveTenantIdOrContext(normalizedTenantCode);
        condition.put("tenantId", tenantId);
        condition.put("tenantCode", normalizedTenantCode);
        condition.put("loginCode", normalizedLoginCode);

        PlatformUserVO user = platformUserDAO.selectUserByTenantCodeAndLoginCode(condition);
        if (user == null || user.getLoginId() == null) {
            throw new IllegalStateException("사용자 계정을 찾을 수 없습니다.");
        }

        Map<String, Object> updatePayload = new HashMap<String, Object>();
        updatePayload.put("loginId", user.getLoginId());
        updatePayload.put("profileImage", normalizeImageValue(payload.getProfileImage()));
        updatePayload.put("stampImage", normalizeImageValue(payload.getStampImage()));
        platformUserDAO.updateLoginImages(updatePayload);

        return getMyPageUser(normalizedTenantCode, normalizedLoginCode);
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

        replaceRoleMappings(tenantId, loginId, resolveRoleCode(payload));
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

        replaceRoleMappings(tenantId, loginId, resolveRoleCode(payload));
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
    @Transactional(rollbackFor = Exception.class)
    public String resetPassword(Long userId, String tenantCode) throws Exception {
        if (userId == null) {
            throw new IllegalArgumentException("user id is required");
        }

        String normalizedTenantCode = normalizeTenantCode(tenantCode);
        Long tenantId = resolveTenantIdOrContext(normalizedTenantCode);
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "tenantCode를 확인할 수 없습니다.");
        }

        Map<String, Object> condition = new HashMap<String, Object>();
        condition.put("tenantId", tenantId);
        condition.put("tenantCode", normalizedTenantCode);
        condition.put("userId", userId);

        PlatformUserVO user = platformUserDAO.selectUserDetail(condition);
        if (user == null || user.getLoginId() == null || !StringUtils.hasText(user.getLoginCode())) {
            throw new IllegalStateException("사용자 계정을 찾을 수 없습니다.");
        }

        String tempPassword = user.getLoginCode() + user.getLoginCode();
        String passwordHash = EgovFileScrty.encryptPassword(tempPassword, user.getLoginCode());

        Map<String, Object> updatePayload = new HashMap<String, Object>();
        updatePayload.put("loginId", user.getLoginId());
        updatePayload.put("passwordHash", passwordHash);
        platformUserDAO.updateLoginPasswordHash(updatePayload);

        return tempPassword;
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
        Long tenantId = resolveTenantIdOrContext(payload.getTenantCode());
        if (tenantId == null) {
            tenantId = platformUserDAO.selectTenantIdByCode(normalizeTenantCode(payload.getTenantCode()));
        }
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
        if (!StringUtils.hasText(resolveRoleCode(payload))) {
            throw new IllegalArgumentException("roleCode는 필수입니다.");
        }
    }

    private String resolveRoleCode(PlatformUserSaveRequestVO payload) {
        if (StringUtils.hasText(payload.getRoleCode())) {
            return payload.getRoleCode().trim().toUpperCase(Locale.ROOT);
        }

        if (payload.getRoleCodes() != null) {
            for (String code : payload.getRoleCodes()) {
                if (StringUtils.hasText(code)) {
                    return code.trim().toUpperCase(Locale.ROOT);
                }
            }
        }

        return "";
    }

    private void replaceRoleMappings(Long tenantId, Long loginId, String roleCode) throws Exception {
        if (loginId == null) {
            throw new IllegalArgumentException("login account is required");
        }
        if (!StringUtils.hasText(roleCode)) {
            throw new IllegalArgumentException("roleCode는 필수입니다.");
        }

        platformUserDAO.deleteLoginAccountRolesByLoginId(loginId);
        Map<String, Object> condition = new HashMap<String, Object>();
        condition.put("tenantId", tenantId);
        condition.put("roleCode", roleCode);
        Long roleId = platformUserDAO.selectRoleIdByCode(condition);
        if (roleId == null) {
            throw new IllegalArgumentException("유효하지 않은 roleCode입니다.");
        }

        Map<String, Object> payload = new HashMap<String, Object>();
        payload.put("loginId", loginId);
        payload.put("roleId", roleId);
        platformUserDAO.insertLoginAccountRole(payload);
    }

    private void validatePasswordChangePayload(PlatformUserPasswordChangeRequestVO payload) {
        if (payload == null) {
            throw new IllegalArgumentException("요청 본문이 필요합니다.");
        }
        if (!StringUtils.hasText(payload.getCurrentPassword())) {
            throw new IllegalArgumentException("현재 비밀번호는 필수입니다.");
        }
        if (!StringUtils.hasText(payload.getNewPassword())) {
            throw new IllegalArgumentException("새 비밀번호는 필수입니다.");
        }
        if (!StringUtils.hasText(payload.getConfirmPassword())) {
            throw new IllegalArgumentException("새 비밀번호 확인은 필수입니다.");
        }
        if (!payload.getNewPassword().equals(payload.getConfirmPassword())) {
            throw new IllegalArgumentException("새 비밀번호와 확인 값이 일치하지 않습니다.");
        }
        if (payload.getNewPassword().trim().length() < 8) {
            throw new IllegalArgumentException("새 비밀번호는 8자 이상이어야 합니다.");
        }
    }

    private void validateImageChangePayload(PlatformUserImageUpdateRequestVO payload) {
        if (payload == null) {
            throw new IllegalArgumentException("요청 본문이 필요합니다.");
        }

        boolean hasProfileImage = StringUtils.hasText(normalizeImageValue(payload.getProfileImage()));
        boolean hasStampImage = StringUtils.hasText(normalizeImageValue(payload.getStampImage()));
        if (!hasProfileImage && !hasStampImage) {
            throw new IllegalArgumentException("저장할 이미지가 없습니다.");
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

    private Long resolveTenantIdOrContext(String tenantCode) {
        Long tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            return tenantId;
        }
        if (!StringUtils.hasText(tenantCode)) {
            return null;
        }
        try {
            return platformUserDAO.selectTenantIdByCode(normalizeTenantCode(tenantCode));
        } catch (Exception e) {
            return null;
        }
    }

    private String normalizeNullable(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String normalizeImageValue(String value) {
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
