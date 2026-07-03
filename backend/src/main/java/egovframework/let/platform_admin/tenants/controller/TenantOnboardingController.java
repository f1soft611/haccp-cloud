package egovframework.let.platform_admin.tenants.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import egovframework.let.platform_admin.tenants.domain.model.TenantOnboardingCompleteRequestVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantVerificationResponseVO;
import egovframework.let.platform_admin.tenants.service.TenantOnboardingService;
import egovframework.let.platform_admin.tenants.service.exception.MailAuthenticationFailureException;
import egovframework.let.platform_admin.tenants.service.exception.MailConfigurationException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 테넌트 온보딩 API 컨트롤러
 * @author SHMT-MES
 * @since 2026.07.03
 * @version 1.0
 * @see
 *
 * <pre>
 * << 개정이력(Modification Information) >>
 *
 *   수정일      수정자           수정내용
 *  -------    --------    ---------------------------
 *   2026.07.03 SHMT-MES          최초 생성
 *
 * </pre>
 */
@RestController
@RequestMapping("/api/v1/tenants/onboarding")
@Tag(name = "TenantOnboardingController", description = "테넌트 온보딩 관리")
@RequiredArgsConstructor
@Slf4j
public class TenantOnboardingController {

    private final TenantOnboardingService tenantOnboardingService;

    /**
     * 인증 이메일 발송 API
     *
     * @param tenantCode 테넌트 코드
     * @param loginAccountId 로그인 계정 ID
     * @param adminEmail 관리자 이메일
     * @return 처리 결과 응답
     */
    @PostMapping("/send-verification-email")
    @Operation(summary = "인증 이메일 발송",
            description = "테넌트 온보딩 시 인증 이메일 발송")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "이메일 발송 성공"),
            @ApiResponse(responseCode = "400", description = "요청 파라미터 오류"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResponseEntity<?> sendVerificationEmail(
            @RequestParam(required = true) String tenantCode,
            @RequestParam(required = true) String loginAccountId,
            @RequestParam(required = true) String adminEmail,
            @RequestParam(required = false) String adminName) {

        try {
            tenantOnboardingService.createAndSendVerificationEmail(tenantCode, loginAccountId, adminEmail, adminName);

            Map<String, Object> response = new HashMap<String, Object>();
            response.put("code", "200");
            response.put("message", "인증 이메일 발송이 완료되었습니다");
            response.put("data", null);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<String, Object>();
            response.put("code", "400");
            response.put("message", e.getMessage());
            response.put("data", null);

            return ResponseEntity.badRequest().body(response);

        } catch (MailConfigurationException e) {
            return buildMailConfigErrorResponse(e.getMessage());

        } catch (MailAuthenticationFailureException e) {
            return buildMailAuthErrorResponse(e.getMessage());

        } catch (Exception e) {
            log.error("인증 이메일 발송 중 오류 발생", e);

            Map<String, Object> response = new HashMap<String, Object>();
            response.put("code", "500");
            response.put("message", "서버 오류가 발생했습니다");
            response.put("data", null);

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/dispatch-verification-email")
    @Operation(summary = "테넌트 코드 기반 인증 이메일 발송",
            description = "테넌트 코드로 관리자 이메일과 로그인 계정을 찾아 인증 메일을 발송")
    public ResponseEntity<?> dispatchVerificationEmail(@RequestParam(required = true) String tenantCode) {
        try {
            tenantOnboardingService.dispatchVerificationEmail(tenantCode, null);

            Map<String, Object> response = new HashMap<String, Object>();
            response.put("code", "200");
            response.put("message", "인증 이메일 발송이 완료되었습니다");
            response.put("data", null);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<String, Object>();
            response.put("code", "400");
            response.put("message", e.getMessage());
            response.put("data", null);

            return ResponseEntity.badRequest().body(response);
        } catch (MailConfigurationException e) {
            return buildMailConfigErrorResponse(e.getMessage());
        } catch (MailAuthenticationFailureException e) {
            return buildMailAuthErrorResponse(e.getMessage());
        } catch (IllegalStateException e) {
            Map<String, Object> response = new HashMap<String, Object>();
            response.put("code", "409");
            response.put("message", e.getMessage());
            response.put("data", null);

            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        } catch (Exception e) {
            log.error("인증 이메일 발송(tenantCode) 중 오류 발생", e);

            Map<String, Object> response = new HashMap<String, Object>();
            response.put("code", "500");
            response.put("message", "서버 오류가 발생했습니다");
            response.put("data", null);

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/resend-verification-email")
    @Operation(summary = "인증 이메일 재발송",
            description = "온보딩 진행 업체의 인증 메일 재발송")
    public ResponseEntity<?> resendVerificationEmail(@RequestParam(required = true) String tenantCode) {
        try {
            tenantOnboardingService.resendVerificationEmail(tenantCode);

            Map<String, Object> response = new HashMap<String, Object>();
            response.put("code", "200");
            response.put("message", "인증 이메일 재발송이 완료되었습니다");
            response.put("data", null);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<String, Object>();
            response.put("code", "400");
            response.put("message", e.getMessage());
            response.put("data", null);

            return ResponseEntity.badRequest().body(response);
        } catch (MailConfigurationException e) {
            return buildMailConfigErrorResponse(e.getMessage());
        } catch (MailAuthenticationFailureException e) {
            return buildMailAuthErrorResponse(e.getMessage());
        } catch (IllegalStateException e) {
            Map<String, Object> response = new HashMap<String, Object>();
            response.put("code", "409");
            response.put("message", e.getMessage());
            response.put("data", null);

            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        } catch (Exception e) {
            log.error("인증 이메일 재발송 중 오류 발생", e);

            Map<String, Object> response = new HashMap<String, Object>();
            response.put("code", "500");
            response.put("message", "서버 오류가 발생했습니다");
            response.put("data", null);

            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Task 16에서 구현 예정: 이메일 인증 토큰 검증 API
     *
     * @param authToken 인증 토큰
     * @return 처리 결과 응답
     */
    @PostMapping("/verify-email")
    @Operation(summary = "이메일 인증",
            description = "인증 토큰으로 이메일 검증")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "이메일 인증 성공"),
            @ApiResponse(responseCode = "400", description = "토큰 누락 또는 미존재"),
            @ApiResponse(responseCode = "410", description = "토큰 만료 또는 이미 사용"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResponseEntity<?> verifyEmailToken(@RequestParam(required = true) String authToken) {
        try {
            TenantVerificationResponseVO result = tenantOnboardingService.verifyEmailToken(authToken);

            Map<String, Object> response = new HashMap<String, Object>();
            response.put("code", "200");
            response.put("message", "이메일 인증이 완료되었습니다");
            response.put("data", result);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<String, Object>();
            response.put("code", "400");
            response.put("message", e.getMessage());
            response.put("data", null);

            return ResponseEntity.badRequest().body(response);

        } catch (IllegalStateException e) {
            Map<String, Object> response = new HashMap<String, Object>();
            response.put("code", "410");
            response.put("message", e.getMessage());
            response.put("data", null);

            return ResponseEntity.status(HttpStatus.GONE).body(response);

        } catch (Exception e) {
            log.error("이메일 인증 중 오류 발생", e);

            Map<String, Object> response = new HashMap<String, Object>();
            response.put("code", "500");
            response.put("message", "서버 오류가 발생했습니다");
            response.put("data", null);

            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Task 17에서 구현 예정: 온보딩 완료 API
     *
     * @param requestVO 온보딩 완료 요청 바디
     * @return 처리 결과 응답
     */
    @PostMapping("/complete")
    @Operation(summary = "온보딩 완료",
            description = "비밀번호, 전화번호 설정 및 활성화")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "온보딩 완료"),
            @ApiResponse(responseCode = "400", description = "요청 파라미터 오류"),
            @ApiResponse(responseCode = "410", description = "토큰 유효하지 않음"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResponseEntity<?> completeOnboarding(@RequestBody TenantOnboardingCompleteRequestVO requestVO) {
        try {
            if (requestVO == null || requestVO.getTenantCode() == null
                    || requestVO.getAuthToken() == null || requestVO.getPassword() == null) {
                Map<String, Object> response = new HashMap<String, Object>();
                response.put("code", "400");
                response.put("message", "필수 항목이 누락되었습니다");
                response.put("data", null);

                return ResponseEntity.badRequest().body(response);
            }

            tenantOnboardingService.completeOnboarding(requestVO);

            Map<String, Object> response = new HashMap<String, Object>();
            response.put("code", "200");
            response.put("message", "온보딩이 완료되었습니다");
            response.put("data", null);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<String, Object>();
            response.put("code", "400");
            response.put("message", e.getMessage());
            response.put("data", null);

            return ResponseEntity.badRequest().body(response);

        } catch (IllegalStateException e) {
            Map<String, Object> response = new HashMap<String, Object>();
            response.put("code", "410");
            response.put("message", e.getMessage());
            response.put("data", null);

            return ResponseEntity.status(HttpStatus.GONE).body(response);

        } catch (Exception e) {
            log.error("온보딩 완료 중 오류 발생", e);

            Map<String, Object> response = new HashMap<String, Object>();
            response.put("code", "500");
            response.put("message", "서버 오류가 발생했습니다");
            response.put("data", null);

            return ResponseEntity.internalServerError().body(response);
        }
    }

    private ResponseEntity<Map<String, Object>> buildMailConfigErrorResponse(String message) {
        Map<String, Object> response = new HashMap<String, Object>();
        response.put("code", "503");
        response.put("errorCode", "MAIL_CONFIG_ERROR");
        response.put("message", message);
        response.put("data", null);

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    private ResponseEntity<Map<String, Object>> buildMailAuthErrorResponse(String message) {
        Map<String, Object> response = new HashMap<String, Object>();
        response.put("code", "502");
        response.put("errorCode", "MAIL_AUTH_ERROR");
        response.put("message", message);
        response.put("data", null);

        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(response);
    }
}
