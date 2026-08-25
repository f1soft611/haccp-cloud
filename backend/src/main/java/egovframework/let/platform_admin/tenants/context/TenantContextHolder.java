package egovframework.let.platform_admin.tenants.context;

import lombok.extern.slf4j.Slf4j;

/**
 * 테넌트 컨텍스트 홀더
 * ThreadLocal을 사용하여 요청 범위의 테넌트 ID를 관리
 *
 * @author 멀티테넌트팀
 * @since 2026-06-23
 */
@Slf4j
public class TenantContextHolder {
    private static final ThreadLocal<Long> tenantIdHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> tenantCodeHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> dbKeyHolder = new ThreadLocal<>();

    public static void setTenantId(Long tenantId) {
        if (tenantId != null) {
            log.debug("TenantContext 설정: tenantId = {}", tenantId);
            tenantIdHolder.set(tenantId);
        }
    }

    public static Long getTenantId() {
        Long tenantId = tenantIdHolder.get();
        log.debug("TenantContext 조회: tenantId = {}", tenantId);
        return tenantId;
    }

    public static void setTenantCode(String tenantCode) {
        if (tenantCode != null && !tenantCode.trim().isEmpty()) {
            tenantCodeHolder.set(PlatformTenantCodes.normalize(tenantCode));
        }
    }

    public static String getTenantCode() {
        return tenantCodeHolder.get();
    }

    public static void setDbKey(String dbKey) {
        if (dbKey != null && !dbKey.trim().isEmpty()) {
            dbKeyHolder.set(dbKey.trim().toUpperCase());
        }
    }

    public static String getDbKey() {
        return dbKeyHolder.get();
    }

    public static void clear() {
        log.debug("TenantContext 초기화");
        tenantIdHolder.remove();
        tenantCodeHolder.remove();
        dbKeyHolder.remove();
    }

    public static boolean hasContext() {
        return tenantIdHolder.get() != null || tenantCodeHolder.get() != null || dbKeyHolder.get() != null;
    }
}
