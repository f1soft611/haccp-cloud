package egovframework.let.platform_admin.tenants.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import egovframework.let.platform_admin.tenants.domain.model.TenantOnboardingCompleteRequestVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantVerificationResponseVO;
import egovframework.let.platform_admin.tenants.service.TenantOnboardingService;
import egovframework.let.platform_admin.tenants.service.exception.MailAuthenticationFailureException;
import egovframework.let.platform_admin.tenants.service.exception.MailConfigurationException;
import egovframework.com.cmm.util.ResultVoHelper;
import org.egovframe.rte.fdl.idgnr.EgovIdGnrService;
import org.egovframe.rte.fdl.property.EgovPropertyService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.context.annotation.ComponentScan.Filter;
import org.springframework.context.annotation.FilterType;
import org.springframework.test.web.servlet.MockMvc;
import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import org.mockito.invocation.InvocationOnMock;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
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

        @MockBean(name = "resultVoHelper")
        private ResultVoHelper resultVoHelper;

        @MockBean(name = "propertiesService")
        private EgovPropertyService propertiesService;

        @MockBean(name = "egovFileIdGnrService")
        private EgovIdGnrService egovFileIdGnrService;

        @BeforeEach
        void setUpResultVoHelperStub() {
                lenient().when(resultVoHelper.buildFromMap(anyMap(), any(ResponseCode.class)))
                                .thenAnswer((InvocationOnMock invocation) -> {
                                        @SuppressWarnings("unchecked")
                                        java.util.Map<String, Object> resultMap = (java.util.Map<String, Object>) invocation.getArgument(0);
                                        ResponseCode code = invocation.getArgument(1);
                                        ResultVO resultVO = new ResultVO();
                                        resultVO.setResult(resultMap);
                                        resultVO.setResultCode(code.getCode());
                                        resultVO.setResultMessage(code.getMessage());
                                        return resultVO;
                                });
        }

    /**
     * 테스트 1: 인증 이메일 발송 성공
     */
    @Test
    void dispatchVerificationEmail_ReturnsOk() throws Exception {
        // Given
        String tenantCode = "TEST_TENANT";
        String adminName = "홍길동";

        doNothing().when(tenantOnboardingService)
                .dispatchVerificationEmail(tenantCode, adminName);

        // When & Then
        mockMvc.perform(post("/api/v1/platform-admin/tenants/{tenantCode}/onboarding/verification-emails", tenantCode)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"adminName\":\"" + adminName + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultCode").value(200))
                .andExpect(jsonPath("$.resultMessage").exists())
                .andExpect(jsonPath("$.result.tenantCode").value(tenantCode));
    }

    /**
     * 테스트 2: 이메일 토큰 검증 성공
     */
    @Test
        void verifyEmailToken_ReturnsOk() throws Exception {
        // Given
                String tenantCode = "TEST_TENANT";
        String authToken = "123456-550e8400-e29b-41d4-a716-446655440000";

        TenantVerificationResponseVO responseVO = TenantVerificationResponseVO.builder()
                .tenantCode("TEST_TENANT")
                .tenantNm("Test Company")
                .adminEmail("admin@test.com")
                .loginAccountId(1L)
                .verified(true)
                .message("이메일 인증이 완료되었습니다")
                .build();

        when(tenantOnboardingService.verifyEmailToken(tenantCode, authToken)).thenReturn(responseVO);

        // When & Then
        mockMvc.perform(post("/api/v1/platform-admin/tenants/{tenantCode}/onboarding/verifications", tenantCode)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"authToken\":\"" + authToken + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultCode").value(200))
                .andExpect(jsonPath("$.resultMessage").exists())
                .andExpect(jsonPath("$.result.tenantCode").value(tenantCode))
                .andExpect(jsonPath("$.result.verification.tenantCode").value("TEST_TENANT"))
                .andExpect(jsonPath("$.result.verification.verified").value(true));
    }

    /**
     * 테스트 3: 온보딩 완료 성공
     */
    @Test
    void completeOnboarding_ReturnsOk() throws Exception {
        // Given
                String tenantCode = "TEST_TENANT";
        TenantOnboardingCompleteRequestVO requestVO = new TenantOnboardingCompleteRequestVO();
        requestVO.setAuthToken("123456-550e8400-e29b-41d4-a716-446655440000");
        requestVO.setPassword("newPassword123!");
        requestVO.setPhoneNumber("010-1234-5678");

        doNothing().when(tenantOnboardingService)
                .completeOnboarding(any(TenantOnboardingCompleteRequestVO.class));

        // When & Then
        mockMvc.perform(post("/api/v1/platform-admin/tenants/{tenantCode}/onboarding/completions", tenantCode)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestVO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultCode").value(200))
                .andExpect(jsonPath("$.resultMessage").exists())
                .andExpect(jsonPath("$.result.tenantCode").value(tenantCode))
                .andExpect(jsonPath("$.result.completed").value(true));

        org.mockito.ArgumentCaptor<TenantOnboardingCompleteRequestVO> captor = org.mockito.ArgumentCaptor.forClass(TenantOnboardingCompleteRequestVO.class);
        verify(tenantOnboardingService).completeOnboarding(captor.capture());
        org.junit.jupiter.api.Assertions.assertEquals(tenantCode, captor.getValue().getTenantCode());
    }

    @Test
    void verifyEmailToken_WhenTenantMismatch_ReturnsBusinessError() throws Exception {
        String tenantCode = "TENANT_A";
        String authToken = "token-1";
        when(tenantOnboardingService.verifyEmailToken(tenantCode, authToken))
                .thenThrow(new IllegalArgumentException("요청 테넌트와 인증 토큰의 테넌트가 일치하지 않습니다"));

        mockMvc.perform(post("/api/v1/platform-admin/tenants/{tenantCode}/onboarding/verifications", tenantCode)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"authToken\":\"" + authToken + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultCode").value(600))
                .andExpect(jsonPath("$.result.errorCode").value("TENANT_MISMATCH"));
    }

    @Test
    void verifyEmailToken_WhenAuthTokenMissing_ReturnsBusinessError() throws Exception {
        mockMvc.perform(post("/api/v1/platform-admin/tenants/{tenantCode}/onboarding/verifications", "TENANT_A")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultCode").value(600))
                .andExpect(jsonPath("$.result.errorCode").value("INVALID_AUTH_TOKEN"));
    }

        @Test
        void verifyEmailToken_WhenServiceReturnsNull_ReturnsBusinessError() throws Exception {
                when(tenantOnboardingService.verifyEmailToken(eq("TENANT_A"), eq("token-null"))).thenReturn(null);

                mockMvc.perform(post("/api/v1/platform-admin/tenants/{tenantCode}/onboarding/verifications", "TENANT_A")
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content("{\"authToken\":\"token-null\"}"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.resultCode").value(600))
                                .andExpect(jsonPath("$.result.errorCode").value("INVALID_AUTH_TOKEN"));
        }

    @Test
    void completeOnboarding_WhenPasswordBlank_ReturnsBusinessError() throws Exception {
        mockMvc.perform(post("/api/v1/platform-admin/tenants/{tenantCode}/onboarding/completions", "TENANT_A")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"authToken\":\"token-1\",\"password\":\"   \"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultCode").value(600))
                .andExpect(jsonPath("$.result.errorCode").value("MISSING_REQUIRED_FIELDS"));
    }

        @Test
        void completeOnboarding_WhenBodyMissing_ReturnsBusinessError() throws Exception {
                mockMvc.perform(post("/api/v1/platform-admin/tenants/{tenantCode}/onboarding/completions", "TENANT_A")
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(""))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.resultCode").value(600))
                                .andExpect(jsonPath("$.result.errorCode").value("MISSING_REQUIRED_FIELDS"));
        }

                    @Test
                    void dispatchVerificationEmail_WhenMailConfigError_Returns503() throws Exception {
                        String tenantCode = "TENANT_000001";

                        doThrow(new MailConfigurationException("SMTP 인증 정보가 누락되었습니다."))
                                .when(tenantOnboardingService)
                                .dispatchVerificationEmail(tenantCode, null);

                        mockMvc.perform(post("/api/v1/platform-admin/tenants/{tenantCode}/onboarding/verification-emails", tenantCode)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content("{}"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.resultCode").value(600))
                                .andExpect(jsonPath("$.result.errorCode").value("MAIL_CONFIG_ERROR"))
                                .andExpect(jsonPath("$.result.statusCode").value("503"));
                    }

                    @Test
                    void dispatchVerificationEmail_WhenMailAuthError_Returns502() throws Exception {
                        String tenantCode = "TENANT_000001";

                        doThrow(new MailAuthenticationFailureException("SMTP 인증 실패"))
                                .when(tenantOnboardingService)
                                .dispatchVerificationEmail(tenantCode, null);

                        mockMvc.perform(post("/api/v1/platform-admin/tenants/{tenantCode}/onboarding/verification-emails", tenantCode)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content("{}"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.resultCode").value(600))
                                .andExpect(jsonPath("$.result.errorCode").value("MAIL_AUTH_ERROR"))
                                .andExpect(jsonPath("$.result.statusCode").value("502"));
                    }
}
