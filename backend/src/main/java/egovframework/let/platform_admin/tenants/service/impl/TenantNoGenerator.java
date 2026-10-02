package egovframework.let.platform_admin.tenants.service.impl;

import java.security.SecureRandom;

/**
 * 플랫폼 테넌트 업체번호(랜덤 6자리) 생성기
 */
public class TenantNoGenerator {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int MIN = 100000;
    private static final int RANGE = 900000;

    private TenantNoGenerator() {
    }

    public static String generate() {
        return String.valueOf(MIN + RANDOM.nextInt(RANGE));
    }
}