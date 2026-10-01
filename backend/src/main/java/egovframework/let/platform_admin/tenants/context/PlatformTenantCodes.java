package egovframework.let.platform_admin.tenants.context;

public final class PlatformTenantCodes {

    public static final String CANONICAL = "PLATFORM";
    private static final String LEGACY = "000001";

    private PlatformTenantCodes() {
    }

    public static boolean isPlatform(String tenantCode) {
        if (tenantCode == null) {
            return false;
        }

        String normalized = tenantCode.trim().toUpperCase();
        return CANONICAL.equals(normalized) || LEGACY.equals(normalized);
    }

    public static String normalize(String tenantCode) {
        if (isPlatform(tenantCode)) {
            return CANONICAL;
        }

        if (tenantCode == null) {
            return null;
        }

        String normalized = tenantCode.trim().toUpperCase();
        if (normalized.startsWith("TENANT_")) {
            return normalized.substring("TENANT_".length());
        }

        return normalized;
    }
}