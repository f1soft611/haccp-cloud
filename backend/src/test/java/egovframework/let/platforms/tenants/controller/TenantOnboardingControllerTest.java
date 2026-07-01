package egovframework.let.platform_admin.tenants.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import egovframework.let.platform_admin.tenants.domain.model.TenantOnboardingCompleteRequestVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantVerificationResponseVO;
import egovframework.let.platform_admin.tenants.service.TenantOnboardingService;
import egovframework.let.platform_admin.tenants.service.exception.MailAuthenticationFailureException;
import egovframework.let.platform_admin.tenants.service.exception.MailConfigurationException;
import org.egovframe.rte.fdl.idgnr.EgovIdGnrService;
import org.egovframe.rte.fdl.property.EgovPropertyService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.context.annotation.ComponentScan.Filter;
import org.springframework.context.annotation.FilterType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 테넌트 온보딩 API 컨트롤러 테스트
 */
@WebMvcTest(useDefaultFilters = false,
        includeFilters = @Filter(type = FilterType.ASSIGNABLE_TYPE, classes = TenantOnboardingController.class))
@AutoConfigureMockMvc(addFilters = false)
class TenantOnboardingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TenantOnboardingService tenantOnboardingService;

        @MockBean(name = "propertiesService")
        private EgovPropertyService propertiesService;

        @MockBean(name = "egovFileIdGnrService")
        private EgovIdGnrService egovFileIdGnrService;

    /**
     * 테스트 1: 인증 이메일 발송 성공
     */
    @Test
    void sendVerificationEmail_ReturnsOk() throws Exception {
        // Given
        String tenantCode = "TEST_TENANT";
        String loginAccountId = "admin";
        String adminEmail = "admin@test.com";

        doNothing().when(tenantOnboardingService)
                .createAndSendVerificationEmail(tenantCode, loginAccountId, adminEmail);

        // When & Then
        mockMvc.perform(post("/api/v1/tenants/onboarding/send-verification-email")
                        .param("tenantCode", tenantCode)
                        .param("loginAccountId", loginAccountId)
                        .param("adminEmail", adminEmail))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("200"))
                .andExpect(jsonPath("$.message").value("인증 이메일 발송이 완료되었습니다"));
    }

    /**
     * 테스트 2: 이메일 토큰 검증 성공
     */
    @Test
    void verifyEmailToken_ReturnsOk() throws Exception {
        // Given
        String authToken = "123456-550e8400-e29b-41d4-a716-446655440000";

        TenantVerificationResponseVO responseVO = TenantVerificationResponseVO.builder()
                .tenantCode("TEST_TENANT")
                .tenantNm("Test Company")
                .adminEmail("admin@test.com")
                .loginAccountId(1L)
                .verified(true)
                .message("이메일 인증이 완료되었습니다")
                .build();

        when(tenantOnboardingService.verifyEmailToken(authToken)).thenReturn(responseVO);

        // When & Then
        mockMvc.perform(post("/api/v1/tenants/onboarding/verify-email")
                        .param("authToken", authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("200"))
                .andExpect(jsonPath("$.message").value("이메일 인증이 완료되었습니다"))
                .andExpect(jsonPath("$.data.tenantCode").value("TEST_TENANT"))
                .andExpect(jsonPath("$.data.verified").value(true));
    }

    /**
     * 테스트 3: 온보딩 완료 성공
     */
    @Test
    void completeOnboarding_ReturnsOk() throws Exception {
        // Given
        TenantOnboardingCompleteRequestVO requestVO = new TenantOnboardingCompleteRequestVO();
        requestVO.setTenantCode("TEST_TENANT");
        requestVO.setAuthToken("123456-550e8400-e29b-41d4-a716-446655440000");
        requestVO.setPassword("newPassword123!");
        requestVO.setPhoneNumber("010-1234-5678");

        doNothing().when(tenantOnboardingService)
                .completeOnboarding(any(TenantOnboardingCompleteRequestVO.class));

        // When & Then
        mockMvc.perform(post("/api/v1/tenants/onboarding/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestVO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("200"))
                .andExpect(jsonPath("$.message").value("온보딩이 완료되었습니다"));
    }

        @Test
        void dispatchVerificationEmail_ReturnsOk() throws Exception {
                String tenantCode = "TENANT_000001";

                doNothing().when(tenantOnboardingService).dispatchVerificationEmail(tenantCode);

                mockMvc.perform(post("/api/v1/tenants/onboarding/dispatch-verification-email")
                                                .param("tenantCode", tenantCode))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.code").value("200"))
                                .andExpect(jsonPath("$.message").value("인증 이메일 발송이 완료되었습니다"));
        }

        @Test
        void resendVerificationEmail_ReturnsOk() throws Exception {
                String tenantCode = "TENANT_000001";

                doNothing().when(tenantOnboardingService).resendVerificationEmail(tenantCode);

                mockMvc.perform(post("/api/v1/tenants/onboarding/resend-verification-email")
                                                .param("tenantCode", tenantCode))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.code").value("200"))
                                .andExpect(jsonPath("$.message").value("인증 이메일 재발송이 완료되었습니다"));
        }

                    @Test
                    void dispatchVerificationEmail_WhenMailConfigError_Returns503() throws Exception {
                        String tenantCode = "TENANT_000001";

                        doThrow(new MailConfigurationException("SMTP 인증 정보가 누락되었습니다."))
                                .when(tenantOnboardingService)
                                .dispatchVerificationEmail(tenantCode);

                        mockMvc.perform(post("/api/v1/tenants/onboarding/dispatch-verification-email")
                                        .param("tenantCode", tenantCode))
                                .andExpect(status().isServiceUnavailable())
                                .andExpect(jsonPath("$.code").value("503"))
                                .andExpect(jsonPath("$.errorCode").value("MAIL_CONFIG_ERROR"));
                    }

                    @Test
                    void dispatchVerificationEmail_WhenMailAuthError_Returns502() throws Exception {
                        String tenantCode = "TENANT_000001";

                        doThrow(new MailAuthenticationFailureException("SMTP 인증 실패"))
                                .when(tenantOnboardingService)
                                .dispatchVerificationEmail(tenantCode);

                        mockMvc.perform(post("/api/v1/tenants/onboarding/dispatch-verification-email")
                                        .param("tenantCode", tenantCode))
                                .andExpect(status().isBadGateway())
                                .andExpect(jsonPath("$.code").value("502"))
                                .andExpect(jsonPath("$.errorCode").value("MAIL_AUTH_ERROR"));
                    }
}
