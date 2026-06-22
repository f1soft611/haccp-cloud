package egovframework.let.platforms.tenants.service.impl;

/**
 * 플랫폼 테넌트 코드 생성기
 */
final class TenantCodeGenerator {

    private TenantCodeGenerator() {
    }

    static String nextTenantCode(String maxTenantCode) {
        int current = 0;
        String normalized = maxTenantCode == null ? null : maxTenantCode.trim();

        if (normalized != null && !normalized.isEmpty()) {
            current = Integer.parseInt(normalized);
        }

        int next = current + 1;
        if (next > 999999) {
            throw new IllegalStateException("tenant_code exhausted (max: 999999)");
        }

        return String.format("%06d", next);
    }
}
