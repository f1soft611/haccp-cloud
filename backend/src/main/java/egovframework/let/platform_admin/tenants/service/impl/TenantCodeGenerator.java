package egovframework.let.platform_admin.tenants.service.impl;

/**
 * 플랫폼 테넌트 코드 생성기
 */
final class TenantCodeGenerator {

    private static final int DATE_PREFIX_LENGTH = 6;
    private static final int SEQUENCE_LENGTH = 4;

    private TenantCodeGenerator() {
    }

    static String nextTenantCode(String datePrefix, String maxCodeForDate) {
        if (datePrefix == null || datePrefix.trim().length() != DATE_PREFIX_LENGTH) {
            throw new IllegalArgumentException("datePrefix must be 6 digits (yyMMdd)");
        }

        String normalizedPrefix = datePrefix.trim();
        int currentSeq = 0;
        String normalizedMax = maxCodeForDate == null ? null : maxCodeForDate.trim();

        if (normalizedMax != null && !normalizedMax.isEmpty()) {
            if (normalizedMax.length() != DATE_PREFIX_LENGTH + SEQUENCE_LENGTH
                    || !normalizedMax.startsWith(normalizedPrefix)) {
                throw new IllegalArgumentException("maxCodeForDate must match yyMMddNNNN format");
            }
            String seqPart = normalizedMax.substring(DATE_PREFIX_LENGTH);
            currentSeq = Integer.parseInt(seqPart);
        }

        int nextSeq = currentSeq + 1;
        if (nextSeq > 9999) {
            throw new IllegalStateException("daily tenant_code sequence exhausted (max: 9999)");
        }

        return normalizedPrefix + String.format("%04d", nextSeq);
    }
}
