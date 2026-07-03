package egovframework.let.platform_admin.tenants.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Properties;

import javax.mail.Session;
import javax.mail.internet.MimeMessage;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;

import egovframework.let.organization.authorities.domain.model.AuthorityMenuSaveRequestVO;
import egovframework.let.organization.authorities.service.AuthorityService;
import egovframework.let.organization.users.domain.repository.PlatformUserDAO;
import egovframework.let.platform_admin.tenants.domain.model.TenantOnboardingCompleteRequestVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantAuthTokenVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantVerificationResponseVO;
import egovframework.let.platform_admin.tenants.domain.repository.TenantAuthTokenDAO;
import egovframework.let.platform_admin.tenants.domain.repository.TenantInfoDAO;
import egovframework.let.platform_admin.tenants.service.impl.TenantOnboardingServiceImpl;
import egovframework.let.platform_admin.tenants.service.TenantOnboardingService;

/**
 * 테넌트 온보딩 서비스 통합 테스트
 */
@SpringBootTest(
    classes = TenantOnboardingServiceImpl.class,
    properties = {
        "mail.from.address=test@haccpcloud.com",
        "spring.mail.username=test-user",
        "spring.mail.password=test-password"
    })
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

    @MockBean
    private PlatformUserDAO platformUserDAO;

    @MockBean
    private AuthorityService authorityService;

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
        tenantOnboardingService.createAndSendVerificationEmail(tenantCode, loginAccountId, adminEmail, "홍길동");

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
                    adminEmail,
                    "홍길동"));

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
        when(tenantInfoDAO.selectLoginCodeByLoginAccountId(101L)).thenReturn("tenant-admin");

        // When
        TenantVerificationResponseVO response = tenantOnboardingService.verifyEmailToken("TEST_TENANT", authToken);

        // Then
        assertNotNull(response);
        assertEquals("TEST_TENANT", response.getTenantCode());
        assertEquals(101L, response.getLoginAccountId());
        assertEquals("tenant-admin", response.getAdminLoginCode());
        assertTrue(response.isVerified());

        verify(tenantInfoDAO, times(1)).updateLoginAccountOnboardingStatus(101L, "EMAIL_VERIFIED");
        verify(tenantInfoDAO, times(1)).selectTenantNameByCode("TEST_TENANT");
        verify(tenantInfoDAO, times(1)).selectAdminEmailByLoginAccountId(101L);
        verify(tenantInfoDAO, times(1)).selectLoginCodeByLoginAccountId(101L);
    }

    @DisplayName("활성 토큰이 없어도 tenantCode 기반 fallback으로 인증 이메일 재발송된다")
    @Test
    void resendVerificationEmail_FallbackWithTenantCode_Success() {
        // Given
        String tenantCode = "PLATFORM";

        when(tenantInfoDAO.selectTenantIdByCode(tenantCode)).thenReturn(1L);
        when(tenantInfoDAO.selectOnboardingStatusByTenantCode(tenantCode)).thenReturn("EMAIL_SENT");
        when(tenantAuthTokenDAO.selectActiveTokenByTenantCode(tenantCode)).thenReturn(null);
        when(tenantInfoDAO.selectLatestLoginAccountIdByTenantCode(tenantCode)).thenReturn(10L);
        when(tenantInfoDAO.selectAdminEmailByLoginAccountId(10L)).thenReturn("platform-admin@test.com");
        when(tenantInfoDAO.selectTenantNameByCode(tenantCode)).thenReturn("플랫폼");
        when(javaMailSender.createMimeMessage()).thenReturn(new MimeMessage(Session.getInstance(new Properties())));

        // When
        tenantOnboardingService.resendVerificationEmail(tenantCode);

        // Then
        verify(tenantInfoDAO, times(1)).selectLatestLoginAccountIdByTenantCode(tenantCode);
        verify(tenantAuthTokenDAO, times(1)).expireTokensByTenantCode(tenantCode);
        verify(tenantAuthTokenDAO, times(1)).insertToken(any(TenantAuthTokenVO.class));
        verify(tenantInfoDAO, times(1)).updateOnboardingStatusByTenantCode(tenantCode, "EMAIL_SENT");
        verify(javaMailSender, times(1)).send(any(MimeMessage.class));
    }

    @DisplayName("dispatch 발송 시 로그인 계정이 없으면 부트스트랩 계정을 생성하고 메일을 발송한다")
    @Test
    void dispatchVerificationEmail_CreatesBootstrapLoginAccount_WhenLoginAccountMissing() throws Exception {
        // Given
        String tenantCode = "2607010002";
        Long tenantId = 200L;
        String adminEmail = "ops@f1soft.co.kr";

        when(tenantInfoDAO.selectAdminEmailByTenantCode(tenantCode)).thenReturn(adminEmail);
        when(tenantInfoDAO.selectLatestLoginAccountIdByTenantCode(tenantCode)).thenReturn(null);
        when(tenantInfoDAO.selectTenantIdByCode(tenantCode)).thenReturn(tenantId);
        when(platformUserDAO.selectLoginIdByLoginCode(anyMap())).thenReturn(null, 301L);
        when(platformUserDAO.selectUserIdByLoginId(anyMap())).thenReturn(null);
        when(tenantInfoDAO.selectTenantNameByCode(tenantCode)).thenReturn("에프원소프트");
        when(javaMailSender.createMimeMessage()).thenReturn(new MimeMessage(Session.getInstance(new Properties())));

        // When
        tenantOnboardingService.dispatchVerificationEmail(tenantCode, "홍길동");

        // Then
        ArgumentCaptor<HashMap> loginPayloadCaptor = ArgumentCaptor.forClass(HashMap.class);
        verify(platformUserDAO, times(1)).insertLoginAccount(loginPayloadCaptor.capture());
        ArgumentCaptor<HashMap> userPayloadCaptor = ArgumentCaptor.forClass(HashMap.class);
        verify(platformUserDAO, times(1)).insertUser(userPayloadCaptor.capture());
        assertEquals("N", loginPayloadCaptor.getValue().get("useAt"));
        assertEquals("홍길동", userPayloadCaptor.getValue().get("userNm"));
        assertEquals("ops@f1soft.co.kr", userPayloadCaptor.getValue().get("emailAddr"));
        verify(platformUserDAO, times(2)).selectLoginIdByLoginCode(anyMap());
        verify(tenantAuthTokenDAO, times(1)).insertToken(any(TenantAuthTokenVO.class));
        verify(tenantInfoDAO, times(1)).updateOnboardingStatusByTenantCode(tenantCode, "EMAIL_SENT");
        verify(javaMailSender, times(1)).send(any(MimeMessage.class));
    }

        @DisplayName("온보딩 완료 시 테넌트 관리자 권한/메뉴를 자동 구성한다")
        @Test
        void completeOnboarding_ProvisionsTenantAdminAuthorityAndPlanMenus() throws Exception {
        // Given
        String tenantCode = "TEST_TENANT";
        String authToken = "token-value";
        Long loginAccountId = 101L;
        Long tenantId = 100L;

        TenantAuthTokenVO tokenVO = TenantAuthTokenVO.builder()
            .authToken(authToken)
            .tenantCode(tenantCode)
            .loginAccountId(loginAccountId)
            .expiresAt(LocalDateTime.now().plusHours(1))
            .usedAt(null)
            .build();

        TenantOnboardingCompleteRequestVO requestVO = new TenantOnboardingCompleteRequestVO();
        requestVO.setTenantCode(tenantCode);
        requestVO.setAuthToken(authToken);
        requestVO.setPassword("Welcome123!");

        when(tenantAuthTokenDAO.selectTokenByValue(authToken)).thenReturn(tokenVO);
        when(tenantInfoDAO.selectTenantIdByCode(tenantCode)).thenReturn(tenantId);
        when(tenantInfoDAO.selectLoginCodeByLoginAccountId(loginAccountId)).thenReturn("tenant.admin");
        when(tenantInfoDAO.updateLoginAccountPasswordAndActivate(
            eq(loginAccountId),
            any(String.class),
            eq("SHA-512"),
            eq("Y"),
            eq("FIRST_SETUP_COMPLETED")))
            .thenReturn(1);

        when(tenantInfoDAO.selectAdminEmailByTenantCode(tenantCode)).thenReturn("admin@test.com");
        when(tenantInfoDAO.selectTenantNameByCode(tenantCode)).thenReturn("테스트업체");

        when(platformUserDAO.selectRoleIdByCode(anyMap()))
            .thenReturn(11L, 12L);
        when(platformUserDAO.selectUserIdByLoginId(any(HashMap.class))).thenReturn(null);

        when(authorityService.listAllowedMenuCodesByTenantPlan(tenantCode))
            .thenReturn(Arrays.asList("MENU_TENANT_DOCUMENTS", "MENU_TENANT_DEPARTMENTS"));
        when(authorityService.replaceRoleMenus(eq("TENANT_ADMIN"), eq(tenantCode), any(AuthorityMenuSaveRequestVO.class)))
            .thenReturn(new HashMap<String, Object>());
        when(authorityService.replaceRoleMenus(eq("TENANT_USER"), eq(tenantCode), any(AuthorityMenuSaveRequestVO.class)))
            .thenReturn(new HashMap<String, Object>());

        // When
        tenantOnboardingService.completeOnboarding(requestVO);

        // Then
        verify(platformUserDAO, times(1)).insertUser(any(HashMap.class));
        verify(platformUserDAO, times(1)).deleteLoginAccountRolesByLoginId(loginAccountId);
        verify(platformUserDAO, times(1)).insertLoginAccountRole(any(HashMap.class));
        verify(authorityService, times(1)).replaceRoleMenus(eq("TENANT_ADMIN"), eq(tenantCode), any(AuthorityMenuSaveRequestVO.class));
        verify(authorityService, times(1)).replaceRoleMenus(eq("TENANT_USER"), eq(tenantCode), any(AuthorityMenuSaveRequestVO.class));
        verify(authorityService, never()).createRole(any());
        }
}
