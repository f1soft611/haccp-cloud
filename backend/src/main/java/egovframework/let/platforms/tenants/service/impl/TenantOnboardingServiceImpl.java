package egovframework.let.platforms.tenants.service.impl;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import egovframework.let.platforms.tenants.domain.model.TenantAuthTokenVO;
import egovframework.let.platforms.tenants.domain.model.TenantOnboardingCompleteRequestVO;
import egovframework.let.platforms.tenants.domain.model.TenantVerificationResponseVO;
import egovframework.let.platforms.tenants.domain.repository.TenantAuthTokenDAO;
import egovframework.let.platforms.tenants.domain.repository.TenantInfoDAO;
import egovframework.let.platforms.tenants.service.TenantOnboardingService;
import lombok.extern.slf4j.Slf4j;

/**
 * 테넌트 온보딩 서비스 구현체
 */
@Service("tenantOnboardingService")
@Slf4j
public class TenantOnboardingServiceImpl implements TenantOnboardingService {

    @Autowired
    private TenantAuthTokenDAO tenantAuthTokenDAO;

    @Autowired
    private TenantInfoDAO tenantInfoDAO;

    @Autowired(required = false)
    private JavaMailSender javaMailSender;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${mail.from.address:no-reply@haccpcloud.local}")
    private String fromEmail;

    /**
     * Task 11: 이메일 인증 토큰 생성 및 발송
     */
    @Override
    public void createAndSendVerificationEmail(String tenantCode, String loginAccountId, String adminEmail) {
        String normalizedTenantCode = normalizeStorageTenantCode(tenantCode);
        Long tenantId = tenantInfoDAO.selectTenantIdByCode(normalizedTenantCode);
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트가 존재하지 않습니다: " + tenantCode);
        }

        tenantAuthTokenDAO.expireTokensByTenantCode(normalizedTenantCode);

        String authToken = TenantAuthTokenGenerator.generateToken();
        LocalDateTime expiresAt = TenantAuthTokenGenerator.calculateExpiry();

        TenantAuthTokenVO tokenVO = TenantAuthTokenVO.builder()
                .tenantId(tenantId)
                .loginAccountId(parseLoginAccountId(loginAccountId))
                .tenantCode(normalizedTenantCode)
                .authToken(authToken)
                .tokenType("EMAIL_VERIFICATION")
                .expiresAt(expiresAt)
                .usedAt(null)
                .createdAt(LocalDateTime.now())
                .build();
        tenantAuthTokenDAO.insertToken(tokenVO);

        sendVerificationEmail(adminEmail, tenantCode, authToken);

        tenantInfoDAO.updateOnboardingStatusByTenantCode(normalizedTenantCode, "EMAIL_SENT");

        log.info("인증 이메일 발송 완료: tenantCode={}, adminEmail={}", tenantCode, adminEmail);
    }

    /**
     * Task 12: 이메일 인증 토큰 검증
     */
    @Override
    @Transactional
    public TenantVerificationResponseVO verifyEmailToken(String authToken) {
        TenantAuthTokenVO tokenVO = tenantAuthTokenDAO.selectTokenByValue(authToken);
        if (tokenVO == null) {
            throw new IllegalArgumentException("토큰이 존재하지 않습니다: " + authToken);
        }

        if (!tokenVO.isValid()) {
            if (tokenVO.getUsedAt() != null) {
                throw new IllegalStateException("이미 사용된 토큰입니다");
            }
            if (tokenVO.getExpiresAt() == null || tokenVO.getExpiresAt().isBefore(LocalDateTime.now())) {
                throw new IllegalStateException("만료된 토큰입니다");
            }
            throw new IllegalStateException("유효하지 않은 토큰입니다");
        }

        tenantAuthTokenDAO.markTokenAsUsed(authToken);

        if (tokenVO.getLoginAccountId() != null) {
            tenantInfoDAO.updateLoginAccountOnboardingStatus(tokenVO.getLoginAccountId(), "EMAIL_VERIFIED");
        }

        String tenantNm = tenantInfoDAO.selectTenantNameByCode(tokenVO.getTenantCode());
        String adminEmail = tenantInfoDAO.selectAdminEmailByLoginAccountId(tokenVO.getLoginAccountId());

        TenantVerificationResponseVO responseVO = TenantVerificationResponseVO.builder()
                .tenantCode(tokenVO.getTenantCode())
                .tenantNm(tenantNm)
                .adminEmail(adminEmail)
                .loginAccountId(tokenVO.getLoginAccountId())
                .verified(true)
                .message("이메일 인증이 완료되었습니다")
                .build();

        log.info("이메일 인증 완료: tenantCode={}, loginAccountId={}",
                tokenVO.getTenantCode(), tokenVO.getLoginAccountId());

        return responseVO;
    }

    /**
     * Task 13: 온보딩 완료
     */
    @Override
    @Transactional
    public void completeOnboarding(TenantOnboardingCompleteRequestVO requestVO) {
        if (requestVO == null
                || requestVO.getTenantCode() == null
                || requestVO.getAuthToken() == null
                || requestVO.getPassword() == null) {
            throw new IllegalArgumentException("필수 항목이 누락되었습니다");
        }

        String tenantCode = requestVO.getTenantCode().trim();
        String authToken = requestVO.getAuthToken().trim();
        String password = requestVO.getPassword();

        TenantAuthTokenVO tokenVO = tenantAuthTokenDAO.selectTokenByValue(authToken);
        if (tokenVO == null) {
            throw new IllegalStateException("토큰이 존재하지 않습니다");
        }

        if (!tokenVO.isValid()) {
            throw new IllegalStateException("유효하지 않은 토큰입니다");
        }

        if (!tokenVO.getTenantCode().equals(tenantCode)) {
            throw new IllegalStateException("테넌트 코드가 일치하지 않습니다");
        }

        Long loginAccountId = tokenVO.getLoginAccountId();
        if (loginAccountId == null) {
            throw new IllegalStateException("로그인 계정이 존재하지 않습니다");
        }

        String encodedPassword = passwordEncoder.encode(password);
        int updatedLoginAccountCount = tenantInfoDAO.updateLoginAccountPasswordAndActivate(
                loginAccountId,
                encodedPassword,
                "BCRYPT",
                "Y",
                "FIRST_SETUP_COMPLETED");
        if (updatedLoginAccountCount <= 0) {
            throw new IllegalStateException("로그인 계정이 존재하지 않습니다");
        }

        if (requestVO.getPhoneNumber() != null) {
            tenantInfoDAO.updateUserMobileNoByLoginAccountId(loginAccountId, requestVO.getPhoneNumber());
        }

        if (tenantInfoDAO.selectTenantIdByCode(tenantCode) != null) {
            tenantInfoDAO.updateOnboardingStatusByTenantCode(tenantCode, "ACTIVE");
        }

        tenantAuthTokenDAO.markTokenAsUsed(authToken);

        log.info("온보딩 완료: tenantCode={}, loginAccountId={}", tenantCode, loginAccountId);
    }

    /**
     * Task 14: 인증 이메일 재발송
     */
    @Override
    @Transactional
    public void resendVerificationEmail(String tenantCode) {
        String normalizedTenantCode = normalizeStorageTenantCode(tenantCode);

        Long tenantId = tenantInfoDAO.selectTenantIdByCode(normalizedTenantCode);
        if (tenantId == null) {
            throw new IllegalStateException("테넌트가 존재하지 않습니다: " + tenantCode);
        }

        String status = tenantInfoDAO.selectOnboardingStatusByTenantCode(normalizedTenantCode);
        if (status == null || (!status.equals("EMAIL_SENT") && !status.equals("EMAIL_VERIFIED"))) {
            throw new IllegalStateException("현재 상태에서는 재발송이 불가능합니다. 현재 상태: " + status);
        }

        TenantAuthTokenVO existingToken = tenantAuthTokenDAO.selectActiveTokenByTenantCode(normalizedTenantCode);

        Long loginAccountId = null;
        String adminEmail = null;

        if (existingToken != null) {
            loginAccountId = existingToken.getLoginAccountId();
            adminEmail = tenantInfoDAO.selectAdminEmailByLoginAccountId(loginAccountId);
        }

        if (loginAccountId == null || adminEmail == null) {
            throw new IllegalStateException("로그인 계정 정보를 찾을 수 없습니다. tenantCode=" + tenantCode);
        }

        tenantAuthTokenDAO.expireTokensByTenantCode(normalizedTenantCode);

        String newAuthToken = TenantAuthTokenGenerator.generateToken();
        LocalDateTime expiresAt = TenantAuthTokenGenerator.calculateExpiry();

        TenantAuthTokenVO newTokenVO = TenantAuthTokenVO.builder()
            .tenantId(tenantId)
                .loginAccountId(loginAccountId)
                .tenantCode(normalizedTenantCode)
                .authToken(newAuthToken)
                .tokenType("EMAIL_VERIFICATION")
                .expiresAt(expiresAt)
                .usedAt(null)
                .createdAt(LocalDateTime.now())
                .build();
        tenantAuthTokenDAO.insertToken(newTokenVO);

        sendVerificationEmail(adminEmail, tenantCode, newAuthToken);

        tenantInfoDAO.updateOnboardingStatusByTenantCode(normalizedTenantCode, "EMAIL_SENT");

        log.info("인증 이메일 재발송 완료: tenantCode={}, adminEmail={}", tenantCode, adminEmail);
    }

    /**
     * Helper: 이메일 발송
     */
    private void sendVerificationEmail(String toEmail, String tenantCode, String authToken) {
        try {
            if (javaMailSender == null) {
                throw new IllegalStateException("메일 발송 설정이 없습니다. JavaMailSender 빈을 구성해주세요.");
            }

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("[HACCP Cloud] 업체 온보딩 인증 이메일");

            String verificationUrl = "https://app.haccpcloud.com/onboarding/verify?token=" + authToken;
            message.setText("테넌트 코드: " + tenantCode + "\n인증 링크: " + verificationUrl + "\n유효시간: 24시간");

            javaMailSender.send(message);
        } catch (Exception e) {
            log.error("이메일 발송 실패: {}", toEmail, e);
            throw new RuntimeException("이메일 발송 실패", e);
        }
    }

    private Long parseLoginAccountId(String loginAccountId) {
        if (loginAccountId == null || loginAccountId.trim().isEmpty()) {
            throw new IllegalArgumentException("loginAccountId is required");
        }

        try {
            return Long.valueOf(loginAccountId.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("loginAccountId must be numeric");
        }
    }

    private String normalizeStorageTenantCode(String tenantCode) {
        if (tenantCode == null || tenantCode.trim().isEmpty()) {
            throw new IllegalArgumentException("tenantCode is required");
        }

        String trimmed = tenantCode.trim();
        if (trimmed.startsWith("TENANT_")) {
            return trimmed.substring("TENANT_".length());
        }
        return trimmed;
    }
}