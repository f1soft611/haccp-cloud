package egovframework.let.platform_admin.tenants.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Properties;

import javax.mail.Session;
import javax.mail.internet.MimeMessage;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;

import egovframework.let.platform_admin.tenants.domain.model.TenantAuthTokenVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantVerificationResponseVO;
import egovframework.let.platform_admin.tenants.domain.repository.TenantAuthTokenDAO;
import egovframework.let.platform_admin.tenants.domain.repository.TenantInfoDAO;
import egovframework.let.platform_admin.tenants.service.impl.TenantOnboardingServiceImpl;
import egovframework.let.platform_admin.tenants.service.TenantOnboardingService;

/**
 * 테넌트 온보딩 서비스 통합 테스트
 */
@SpringBootTest(classes = TenantOnboardingServiceImpl.class, properties = "mail.from.address=test@haccpcloud.com")
class TenantOnboardingServiceImplTest {

    @Autowired
    private TenantOnboardingService tenantOnboardingService;

    @MockBean
    private TenantAuthTokenDAO tenantAuthTokenDAO;

    @MockBean
    private TenantInfoDAO tenantInfoDAO;

    @MockBean
    private JavaMailSender javaMailSender;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @DisplayName("정상적으로 인증 이메일을 발송하면 토큰 저장, 상태 업데이트, 메일 발송이 수행된다")
    @Test
    void createAndSendVerificationEmail_Success() {
        // Given
        String tenantCode = "TEST_TENANT";
        String loginAccountId = "101";
        String adminEmail = "admin@test.com";

        when(tenantInfoDAO.selectTenantIdByCode(tenantCode)).thenReturn(100L);
        when(javaMailSender.createMimeMessage()).thenReturn(new MimeMessage(Session.getInstance(new Properties())));

        // When
        tenantOnboardingService.createAndSendVerificationEmail(tenantCode, loginAccountId, adminEmail);

        // Then
        ArgumentCaptor<TenantAuthTokenVO> tokenCaptor = ArgumentCaptor.forClass(TenantAuthTokenVO.class);
        verify(tenantAuthTokenDAO, times(1)).insertToken(tokenCaptor.capture());

        TenantAuthTokenVO savedToken = tokenCaptor.getValue();
        assertNotNull(savedToken.getAuthToken());
        assertEquals("EMAIL_VERIFICATION", savedToken.getTokenType());
        assertEquals(tenantCode, savedToken.getTenantCode());
        assertEquals(100L, savedToken.getTenantId());
        assertEquals(101L, savedToken.getLoginAccountId());

        verify(tenantAuthTokenDAO, times(1)).expireTokensByTenantCode(tenantCode);
        verify(tenantInfoDAO, times(1)).updateOnboardingStatusByTenantCode(tenantCode, "EMAIL_SENT");

        verify(javaMailSender, times(1)).send(any(MimeMessage.class));
    }

    @DisplayName("존재하지 않는 테넌트 코드로 이메일 생성 시 예외가 발생한다")
    @Test
    void createAndSendVerificationEmail_ThrowsExceptionWhenTenantNotFound() {
        // Given
        String nonExistentTenantCode = "NON_EXISTENT";
        String loginAccountId = "101";
        String adminEmail = "admin@test.com";

        when(tenantInfoDAO.selectTenantIdByCode(nonExistentTenantCode)).thenReturn(null);

        // When
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> tenantOnboardingService.createAndSendVerificationEmail(
                        nonExistentTenantCode,
                        loginAccountId,
                        adminEmail));

        // Then
        assertTrue(exception.getMessage().contains("테넌트가 존재하지 않습니다"));
    }

    @DisplayName("유효한 이메일 토큰을 검증하면 응답 반환 및 토큰 사용 처리된다")
    @Test
    void verifyEmailToken_Success() {
        // Given
        String authToken = "123456-550e8400-e29b-41d4-a716-446655440000";

        TenantAuthTokenVO tokenVO = TenantAuthTokenVO.builder()
                .authTokenId(1L)
                .tenantId(100L)
                .loginAccountId(101L)
                .tenantCode("TEST_TENANT")
                .authToken(authToken)
                .tokenType("EMAIL_VERIFICATION")
                .expiresAt(LocalDateTime.now().plusHours(24))
                .usedAt(null)
                .createdAt(LocalDateTime.now())
                .build();

        when(tenantAuthTokenDAO.selectTokenByValue(authToken)).thenReturn(tokenVO);
        when(tenantInfoDAO.selectTenantNameByCode("TEST_TENANT")).thenReturn("테스트 테넌트");
        when(tenantInfoDAO.selectAdminEmailByLoginAccountId(101L)).thenReturn("admin@test.com");

        // When
        TenantVerificationResponseVO response = tenantOnboardingService.verifyEmailToken(authToken);

        // Then
        assertNotNull(response);
        assertEquals("TEST_TENANT", response.getTenantCode());
        assertEquals(101L, response.getLoginAccountId());
        assertTrue(response.isVerified());

        verify(tenantAuthTokenDAO, times(1)).markTokenAsUsed(authToken);
        verify(tenantInfoDAO, times(1)).updateLoginAccountOnboardingStatus(101L, "EMAIL_VERIFIED");
        verify(tenantInfoDAO, times(1)).selectTenantNameByCode("TEST_TENANT");
        verify(tenantInfoDAO, times(1)).selectAdminEmailByLoginAccountId(101L);
    }
}
