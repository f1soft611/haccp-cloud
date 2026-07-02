package egovframework.let.platform_admin.tenants.service.impl;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 테넌트 인증 토큰 생성 유틸
 */
public class TenantAuthTokenGenerator {

    private static final SecureRandom random = new SecureRandom();

    // private 생성자: 인스턴스 생성 불가
    private TenantAuthTokenGenerator() {
    }

    /**
     * 인증 토큰 생성
     * 형식: 6자 숫자 + '-' + UUID
     * 예: 123456-550e8400-e29b-41d4-a716-446655440000
     * @return 생성된 토큰
     */
    public static String generateToken() {
        String randomSix = String.format("%06d", random.nextInt(1000000));
        String uuid = UUID.randomUUID().toString();
        return randomSix + "-" + uuid;
    }

    /**
     * 토큰 만료 시간 계산
     * @param hours 유효 시간 (일반적으로 24)
     * @return 만료 시간
     */
    public static LocalDateTime calculateExpiry(int hours) {
        return LocalDateTime.now().plusHours(hours);
    }

    /**
     * 토큰 만료 시간 계산 (기본값 24시간)
     * @return 만료 시간
     */
    public static LocalDateTime calculateExpiry() {
        return calculateExpiry(24);
    }

    /**
     * 토큰이 만료되었는지 확인
     * @param expiresAt 만료 시간
     * @return 만료되었으면 true
     */
    public static boolean isExpired(LocalDateTime expiresAt) {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}
