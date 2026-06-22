package egovframework.let.platforms.factories.service.impl;

/**
 * 플랫폼 공장 코드 생성기
 * @author AI Assistant
 * @since 2026.06.22
 * @version 1.0
 */
final class FactoryCodeGenerator {

    private FactoryCodeGenerator() {
    }

    /**
     * 다음 공장 코드를 생성한다.
     * @param maxFactoryCode 현재 최대 공장 코드
     * @return 다음 공장 코드
     */
    static String nextFactoryCode(String maxFactoryCode) {
        int current = 0;
        String normalized = maxFactoryCode == null ? null : maxFactoryCode.trim();

        if (normalized != null && !normalized.isEmpty()) {
            current = Integer.parseInt(normalized);
        }

        int next = current + 1;
        if (next > 999999) {
            throw new IllegalStateException("factory_code exhausted (max: 999999)");
        }

        return String.format("%06d", next);
    }
}
