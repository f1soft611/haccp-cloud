package egovframework.let.platforms.tenants.context;

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

    /**
     * 테넌트 ID 설정
     * @param tenantId 테넌트 ID
     */
    public static void setTenantId(Long tenantId) {
        if (tenantId != null) {
            log.debug("TenantContext 설정: tenantId = {}", tenantId);
            tenantIdHolder.set(tenantId);
        }
    }

    /**
     * 테넌트 ID 조회
     * @return 테넌트 ID (없으면 null)
     */
    public static Long getTenantId() {
        Long tenantId = tenantIdHolder.get();
        log.debug("TenantContext 조회: tenantId = {}", tenantId);
        return tenantId;
    }

    /**
     * 테넌트 컨텍스트 초기화
     */
    public static void clear() {
        log.debug("TenantContext 초기화");
        tenantIdHolder.remove();
    }

    /**
     * 테넌트 컨텍스트 설정 여부 확인
     * @return 설정되었으면 true
     */
    public static boolean hasContext() {
        return tenantIdHolder.get() != null;
    }
}
