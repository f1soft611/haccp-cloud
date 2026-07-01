package egovframework.let.platform_admin.tenants.service;

import egovframework.let.platform_admin.tenants.domain.model.TenantOnboardingCompleteRequestVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantVerificationResponseVO;

/**
 * 테넌트 온보딩 서비스 인터페이스
 */
public interface TenantOnboardingService {

    /**
     * 이메일 인증 토큰 생성 및 발송
     *
     * @param tenantCode 테넌트 코드
     * @param loginAccountId 로그인 계정 ID
     * @param adminEmail 관리자 이메일
     * @throws IllegalArgumentException 입력값이 유효하지 않거나 테넌트가 존재하지 않는 경우
     */
    void createAndSendVerificationEmail(String tenantCode, String loginAccountId, String adminEmail);

    /**
     * 이메일 인증 토큰 검증
     *
     * @param authToken 인증 토큰
     * @return 검증 결과 VO
     * @throws IllegalArgumentException 입력값이 유효하지 않거나 토큰이 존재하지 않는 경우
     * @throws IllegalStateException 토큰이 만료되었거나 이미 사용된 경우
     */
    TenantVerificationResponseVO verifyEmailToken(String authToken);

    /**
     * 온보딩 완료 (비밀번호, 전화번호 설정 및 활성화)
     *
     * @param requestVO 완료 요청 VO (tenantCode, authToken, password, phoneNumber)
     * @throws IllegalArgumentException 입력값이 유효하지 않은 경우
     * @throws IllegalStateException 토큰이 유효하지 않거나 상태 기반 검증에 실패한 경우
     */
    void completeOnboarding(TenantOnboardingCompleteRequestVO requestVO);

    /**
     * 인증 이메일 재발송
     *
     * @param tenantCode 테넌트 코드
     * @throws IllegalArgumentException 입력값이 유효하지 않은 경우
     * @throws IllegalStateException 테넌트가 미존재, 비활성 상태이거나 현재 상태에서 재발송 불가능한 경우
     */
    void resendVerificationEmail(String tenantCode);
}