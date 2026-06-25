package egovframework.let.platforms.users.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;

import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import egovframework.let.platforms.access.service.PlanAccessService;
import egovframework.let.utl.sim.service.EgovFileScrty;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PlatformUserService {

    private static final String USER_LIMIT_FEATURE_CODE = "LIMIT_USER_COUNT";
    private static final String DEFAULT_INITIAL_PASSWORD = "Welcome123!";

    private final JdbcTemplate jdbcTemplate;
    private final PlanAccessService planAccessService;

    public List<Map<String, Object>> listUsers(Long tenantId, String tenantCode) {
        if (tenantId == null) {
            return Collections.emptyList();
        }

        String sql = ""
                + "SELECT u.user_id, u.user_nm, u.email_addr, u.use_at, "
                + "       COALESCE(d.department_nm, '') AS department_nm, "
                + "       la.login_id, la.login_code, COALESCE(la.use_at, 'Y') AS login_use_at, "
                + "       COALESCE(string_agg(DISTINCT r.role_code, ',' ORDER BY r.role_code), '') AS role_codes "
                + "FROM tb_user u "
                + "JOIN tb_login_account la ON la.login_id = u.login_id "
                + "LEFT JOIN tb_department d ON d.department_id = u.department_id "
                + "LEFT JOIN tb_login_account_role lar ON lar.login_id = la.login_id "
                + "LEFT JOIN tb_role r ON r.role_id = lar.role_id "
                + "WHERE u.tenant_id = ? "
                + "GROUP BY u.user_id, u.user_nm, u.email_addr, u.use_at, d.department_nm, la.login_id, la.login_code, la.use_at "
                + "ORDER BY u.created_at DESC, u.user_id DESC";

        return jdbcTemplate.query(sql, new Object[] {tenantId}, (rs, rowNum) -> {
            List<String> roleCodes = splitRoleCodes(rs.getString("role_codes"));
            String primaryRoleCode = roleCodes.isEmpty() ? "TENANT_USER" : roleCodes.get(0);

            Map<String, Object> row = new LinkedHashMap<String, Object>();
            row.put("id", rs.getLong("user_id"));
            row.put("tenantCode", tenantCode);
            row.put("name", rs.getString("user_nm"));
            row.put("email", rs.getString("email_addr"));
            row.put("department", rs.getString("department_nm"));
            row.put("roleCode", primaryRoleCode);
            row.put("roleCodes", roleCodes);
            row.put("active", "Y".equalsIgnoreCase(rs.getString("use_at"))
                    && "Y".equalsIgnoreCase(rs.getString("login_use_at")));
            return row;
        });
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> createUser(Long tenantId, String tenantCode, UpsertUserRequest request) throws Exception {
        validateUpsertRequest(request);
        ensureWithinUserLimit(tenantId);

        Long departmentId = findOrCreateDepartment(tenantId, request.getDepartment());
        String loginCode = buildUniqueLoginCode(tenantId, request.getEmail());
        String passwordHash = EgovFileScrty.encryptPassword(DEFAULT_INITIAL_PASSWORD, loginCode);

        Long loginId = jdbcTemplate.queryForObject(
                "INSERT INTO tb_login_account (tenant_id, login_code, password_hash, use_at, created_at, updated_at) "
                        + "VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING login_id",
                Long.class,
                tenantId,
                loginCode,
                passwordHash,
                toUseAt(request.getActive(), true));

        Long userId = jdbcTemplate.queryForObject(
                "INSERT INTO tb_user (tenant_id, login_id, user_nm, email_addr, department_id, use_at, created_at, updated_at) "
                        + "VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING user_id",
                Long.class,
                tenantId,
                loginId,
                request.getName().trim(),
                request.getEmail().trim(),
                departmentId,
                toUseAt(request.getActive(), true));

        replaceRoleMappings(tenantId, loginId, resolveRoleCodes(request));
        return getUserById(tenantId, tenantCode, userId);
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> updateUser(Long tenantId, String tenantCode, Long userId, UpsertUserRequest request) {
        if (userId == null) {
            throw new IllegalArgumentException("user id is required");
        }

        validateUpsertRequest(request);

        Map<String, Object> current = resolveUserIdentity(tenantId, userId);
        Long loginId = (Long) current.get("loginId");
        if (loginId == null) {
            throw new IllegalStateException("연결된 로그인 계정을 찾을 수 없습니다.");
        }

        Long departmentId = findOrCreateDepartment(tenantId, request.getDepartment());

        jdbcTemplate.update(
                "UPDATE tb_user SET user_nm = ?, email_addr = ?, department_id = ?, use_at = ?, updated_at = CURRENT_TIMESTAMP "
                        + "WHERE tenant_id = ? AND user_id = ?",
                request.getName().trim(),
                request.getEmail().trim(),
                departmentId,
                toUseAt(request.getActive(), null),
                tenantId,
                userId);

        if (request.getActive() != null) {
            jdbcTemplate.update(
                    "UPDATE tb_login_account SET use_at = ?, updated_at = CURRENT_TIMESTAMP WHERE login_id = ?",
                    toUseAt(request.getActive(), true),
                    loginId);
        }

        replaceRoleMappings(tenantId, loginId, resolveRoleCodes(request));
        return getUserById(tenantId, tenantCode, userId);
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> updateUserActive(Long tenantId, String tenantCode, Long userId, boolean active) {
        if (userId == null) {
            throw new IllegalArgumentException("user id is required");
        }

        Map<String, Object> current = resolveUserIdentity(tenantId, userId);
        Long loginId = (Long) current.get("loginId");
        if (loginId == null) {
            throw new IllegalStateException("연결된 로그인 계정을 찾을 수 없습니다.");
        }

        String useAt = active ? "Y" : "N";

        jdbcTemplate.update(
                "UPDATE tb_user SET use_at = ?, updated_at = CURRENT_TIMESTAMP WHERE tenant_id = ? AND user_id = ?",
                useAt,
                tenantId,
                userId);

        jdbcTemplate.update(
                "UPDATE tb_login_account SET use_at = ?, updated_at = CURRENT_TIMESTAMP WHERE login_id = ?",
                useAt,
                loginId);

        return getUserById(tenantId, tenantCode, userId);
    }

    public Long resolveTenantIdByCode(String tenantCode) {
        return planAccessService.resolveTenantIdByTenantCode(tenantCode);
    }

    private void ensureWithinUserLimit(Long tenantId) {
        if (tenantId == null) {
            throw new IllegalArgumentException("tenant is required");
        }

        if (!planAccessService.isWithinLimit(tenantId, USER_LIMIT_FEATURE_CODE)) {
            throw new IllegalStateException("플랜 사용자 수 제한을 초과했습니다.");
        }
    }

    private Map<String, Object> resolveUserIdentity(Long tenantId, Long userId) {
        String sql = "SELECT user_id, login_id FROM tb_user WHERE tenant_id = ? AND user_id = ? LIMIT 1";
        List<Map<String, Object>> rows = jdbcTemplate.query(sql, new Object[] {tenantId, userId}, (rs, rowNum) -> {
            Map<String, Object> item = new LinkedHashMap<String, Object>();
            item.put("userId", rs.getLong("user_id"));
            item.put("loginId", rs.getLong("login_id"));
            return item;
        });

        if (rows.isEmpty()) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다.");
        }

        return rows.get(0);
    }

    private Map<String, Object> getUserById(Long tenantId, String tenantCode, Long userId) {
        List<Map<String, Object>> list = listUsers(tenantId, tenantCode);
        for (Map<String, Object> item : list) {
            Object idObj = item.get("id");
            if (idObj != null && String.valueOf(idObj).equals(String.valueOf(userId))) {
                return item;
            }
        }

        throw new IllegalStateException("저장 후 사용자 조회에 실패했습니다.");
    }

    private Long findOrCreateDepartment(Long tenantId, String departmentName) {
        String normalizedDepartmentName = departmentName.trim();

        List<Long> existingIds = jdbcTemplate.query(
                "SELECT department_id FROM tb_department WHERE tenant_id = ? AND department_nm = ? ORDER BY department_id LIMIT 1",
                new Object[] {tenantId, normalizedDepartmentName},
                (rs, rowNum) -> rs.getLong("department_id"));

        if (!existingIds.isEmpty()) {
            return existingIds.get(0);
        }

        return jdbcTemplate.queryForObject(
                "INSERT INTO tb_department (tenant_id, department_nm, use_at, created_at, updated_at) "
                        + "VALUES (?, ?, 'Y', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING department_id",
                Long.class,
                tenantId,
                normalizedDepartmentName);
    }

    private String buildUniqueLoginCode(Long tenantId, String email) {
        String localPart = email;
        int atIndex = email.indexOf('@');
        if (atIndex > 0) {
            localPart = email.substring(0, atIndex);
        }

        String base = localPart.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9._-]", "");
        if (!StringUtils.hasText(base)) {
            base = "user";
        }

        String candidate = base;
        int suffix = 1;
        while (existsLoginCode(tenantId, candidate)) {
            candidate = base + suffix;
            suffix += 1;
        }

        return candidate;
    }

    private boolean existsLoginCode(Long tenantId, String loginCode) {
        List<Long> rows = jdbcTemplate.query(
                "SELECT login_id FROM tb_login_account WHERE tenant_id = ? AND login_code = ? LIMIT 1",
                new Object[] {tenantId, loginCode},
                (rs, rowNum) -> rs.getLong("login_id"));
        return !rows.isEmpty();
    }

    private void validateUpsertRequest(UpsertUserRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("요청 본문이 필요합니다.");
        }

        if (!StringUtils.hasText(request.getName())) {
            throw new IllegalArgumentException("이름은 필수입니다.");
        }

        if (!StringUtils.hasText(request.getEmail())) {
            throw new IllegalArgumentException("이메일은 필수입니다.");
        }

        if (!StringUtils.hasText(request.getDepartment())) {
            throw new IllegalArgumentException("부서는 필수입니다.");
        }

        if (resolveRoleCodes(request).isEmpty()) {
            throw new IllegalArgumentException("최소 1개 roleCode가 필요합니다.");
        }
    }

    private List<String> resolveRoleCodes(UpsertUserRequest request) {
        List<String> roleCodes = new ArrayList<String>();
        if (request.getRoleCodes() != null) {
            for (String code : request.getRoleCodes()) {
                if (StringUtils.hasText(code)) {
                    roleCodes.add(code.trim().toUpperCase(Locale.ROOT));
                }
            }
        }

        if (StringUtils.hasText(request.getRoleCode())) {
            roleCodes.add(request.getRoleCode().trim().toUpperCase(Locale.ROOT));
        }

        if (roleCodes.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> deduped = new ArrayList<String>();
        for (String code : roleCodes) {
            if (!deduped.contains(code)) {
                deduped.add(code);
            }
        }
        return deduped;
    }

    private void replaceRoleMappings(Long tenantId, Long loginId, List<String> roleCodes) {
        if (loginId == null) {
            throw new IllegalArgumentException("login account is required");
        }

        List<Long> roleIds = new ArrayList<Long>();
        for (String roleCode : roleCodes) {
            try {
                Long roleId = jdbcTemplate.queryForObject(
                        "SELECT role_id FROM tb_role WHERE tenant_id = ? AND role_code = ? LIMIT 1",
                        Long.class,
                        tenantId,
                        roleCode);
                if (roleId != null) {
                    roleIds.add(roleId);
                }
            } catch (DataAccessException ignore) {
                // skip invalid role code and validate below
            }
        }

        if (roleIds.isEmpty()) {
            throw new IllegalArgumentException("유효한 역할 코드를 찾을 수 없습니다.");
        }

        jdbcTemplate.update("DELETE FROM tb_login_account_role WHERE login_id = ?", loginId);
        for (Long roleId : roleIds) {
            jdbcTemplate.update(
                    "INSERT INTO tb_login_account_role (login_id, role_id, created_at) VALUES (?, ?, CURRENT_TIMESTAMP) "
                            + "ON CONFLICT (login_id, role_id) DO NOTHING",
                    loginId,
                    roleId);
        }
    }

    private List<String> splitRoleCodes(String concatenated) {
        if (!StringUtils.hasText(concatenated)) {
            return Collections.emptyList();
        }

        String[] tokens = concatenated.split(",");
        List<String> result = new ArrayList<String>();
        for (String token : tokens) {
            if (StringUtils.hasText(token)) {
                result.add(token.trim().toUpperCase(Locale.ROOT));
            }
        }
        return result;
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

    public static class UpsertUserRequest {
        private String name;
        private String email;
        private String department;
        private String roleCode;
        private List<String> roleCodes;
        private Boolean active;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getDepartment() {
            return department;
        }

        public void setDepartment(String department) {
            this.department = department;
        }

        public String getRoleCode() {
            return roleCode;
        }

        public void setRoleCode(String roleCode) {
            this.roleCode = roleCode;
        }

        public List<String> getRoleCodes() {
            return roleCodes;
        }

        public void setRoleCodes(List<String> roleCodes) {
            this.roleCodes = roleCodes;
        }

        public Boolean getActive() {
            return active;
        }

        public void setActive(Boolean active) {
            this.active = active;
        }
    }
}
