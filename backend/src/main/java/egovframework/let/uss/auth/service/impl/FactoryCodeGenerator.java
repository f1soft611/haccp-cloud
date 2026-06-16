package egovframework.let.uss.auth.service.impl;

final class FactoryCodeGenerator {

    private FactoryCodeGenerator() {
    }

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
