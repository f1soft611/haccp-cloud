package egovframework.let.platform_admin.tenants.controller;

import java.util.HashMap;
import java.util.Map;

import javax.annotation.Resource;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.ResultVoHelper;
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
@RequestMapping("/api/v1/platform-admin/tenants")
@Tag(name = "TenantOnboardingController", description = "테넌트 온보딩 관리")
@RequiredArgsConstructor
@Slf4j
public class TenantOnboardingController {

    private final TenantOnboardingService tenantOnboardingService;

    @Resource(name = "resultVoHelper")
    private ResultVoHelper resultVoHelper;

    /**
     * 인증 이메일 발송 API
     *
     * @param tenantCode 테넌트 코드
     * @return 처리 결과 응답
     */
    @PostMapping("/{tenantCode}/onboarding/verification-emails")
    @Operation(summary = "인증 이메일 발송",
            description = "테넌트 온보딩 시 인증 이메일 발송")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "이메일 발송 성공"),
            @ApiResponse(responseCode = "400", description = "요청 파라미터 오류"),
            @ApiResponse(responseCode = "502", description = "메일 인증 오류"),
            @ApiResponse(responseCode = "503", description = "메일 설정 오류"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResultVO dispatchVerificationEmail(
            @PathVariable String tenantCode,
            @RequestBody(required = false) Map<String, String> body) {
        if (!hasText(tenantCode)) {
            Map<String, Object> error = new HashMap<String, Object>();
            error.put("statusCode", "400");
            error.put("errorCode", "INVALID_TENANT_CODE");
            error.put("errorMessage", "tenantCode는 필수입니다.");
            return resultVoHelper.buildFromMap(error, ResponseCode.BUSINESS_ERROR);
        }

        tenantCode = tenantCode.trim();
        String adminName = body == null ? null : body.get("adminName");

        try {
            tenantOnboardingService.dispatchVerificationEmail(tenantCode, adminName);

            Map<String, Object> result = new HashMap<String, Object>();
            result.put("tenantCode", tenantCode);
            result.put("message", "인증 이메일 발송이 완료되었습니다");
            return resultVoHelper.buildFromMap(result, ResponseCode.SUCCESS);

        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<String, Object>();
            error.put("statusCode", "400");
            error.put("errorCode", "INVALID_REQUEST");
            error.put("errorMessage", e.getMessage());
            return resultVoHelper.buildFromMap(error, ResponseCode.BUSINESS_ERROR);

        } catch (MailConfigurationException e) {
            return buildMailConfigErrorResponse(e.getMessage());

        } catch (MailAuthenticationFailureException e) {
            return buildMailAuthErrorResponse(e.getMessage());

        } catch (IllegalStateException e) {
            Map<String, Object> error = new HashMap<String, Object>();
            error.put("statusCode", "409");
            error.put("errorCode", "ONBOARDING_CONFLICT");
            error.put("errorMessage", e.getMessage());
            return resultVoHelper.buildFromMap(error, ResponseCode.BUSINESS_ERROR);

        } catch (Exception e) {
            log.error("인증 이메일 발송 중 오류 발생", e);

            Map<String, Object> error = new HashMap<String, Object>();
            error.put("statusCode", "500");
            error.put("errorCode", "INTERNAL_SERVER_ERROR");
            error.put("errorMessage", "서버 오류가 발생했습니다");
            return resultVoHelper.buildFromMap(error, ResponseCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Task 16에서 구현 예정: 이메일 인증 토큰 검증 API
     *
     * @param authToken 인증 토큰
     * @return 처리 결과 응답
     */
    @PostMapping("/{tenantCode}/onboarding/verifications")
    @Operation(summary = "이메일 인증",
            description = "인증 토큰으로 이메일 검증")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "이메일 인증 성공"),
            @ApiResponse(responseCode = "400", description = "토큰 누락 또는 미존재"),
            @ApiResponse(responseCode = "410", description = "토큰 만료 또는 이미 사용"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResultVO verifyEmailToken(
            @PathVariable String tenantCode,
            @RequestBody(required = false) Map<String, String> body) {
        if (!hasText(tenantCode)) {
            Map<String, Object> error = new HashMap<String, Object>();
            error.put("statusCode", "400");
            error.put("errorCode", "INVALID_TENANT_CODE");
            error.put("errorMessage", "tenantCode는 필수입니다.");
            return resultVoHelper.buildFromMap(error, ResponseCode.BUSINESS_ERROR);
        }

        String authToken = body == null ? null : body.get("authToken");
        if (!hasText(authToken)) {
            Map<String, Object> error = new HashMap<String, Object>();
            error.put("statusCode", "400");
            error.put("errorCode", "INVALID_AUTH_TOKEN");
            error.put("errorMessage", "authToken은 필수입니다.");
            return resultVoHelper.buildFromMap(error, ResponseCode.BUSINESS_ERROR);
        }

        tenantCode = tenantCode.trim();
        authToken = authToken.trim();
        try {
            TenantVerificationResponseVO verification = tenantOnboardingService.verifyEmailToken(tenantCode, authToken);
            if (verification == null) {
                Map<String, Object> error = new HashMap<String, Object>();
                error.put("statusCode", "400");
                error.put("errorCode", "INVALID_AUTH_TOKEN");
                error.put("errorMessage", "유효하지 않은 인증 토큰입니다.");
                return resultVoHelper.buildFromMap(error, ResponseCode.BUSINESS_ERROR);
            }

            Map<String, Object> result = new HashMap<String, Object>();
            result.put("tenantCode", tenantCode);
            result.put("verification", verification);
            result.put("message", "이메일 인증이 완료되었습니다");

            return resultVoHelper.buildFromMap(result, ResponseCode.SUCCESS);

        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<String, Object>();
            error.put("statusCode", "400");
            String message = e.getMessage();
            if (hasText(message) && message.contains("일치하지")) {
                error.put("errorCode", "TENANT_MISMATCH");
            } else {
                error.put("errorCode", "INVALID_AUTH_TOKEN");
            }
            error.put("errorMessage", e.getMessage());
            return resultVoHelper.buildFromMap(error, ResponseCode.BUSINESS_ERROR);

        } catch (IllegalStateException e) {
            Map<String, Object> error = new HashMap<String, Object>();
            error.put("statusCode", "410");
            error.put("errorCode", "AUTH_TOKEN_EXPIRED");
            error.put("errorMessage", e.getMessage());
            return resultVoHelper.buildFromMap(error, ResponseCode.BUSINESS_ERROR);

        } catch (Exception e) {
            log.error("이메일 인증 중 오류 발생", e);

            Map<String, Object> error = new HashMap<String, Object>();
            error.put("statusCode", "500");
            error.put("errorCode", "INTERNAL_SERVER_ERROR");
            error.put("errorMessage", "서버 오류가 발생했습니다");
            return resultVoHelper.buildFromMap(error, ResponseCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Task 17에서 구현 예정: 온보딩 완료 API
     *
     * @param requestVO 온보딩 완료 요청 바디
     * @return 처리 결과 응답
     */
    @PostMapping("/{tenantCode}/onboarding/completions")
    @Operation(summary = "온보딩 완료",
            description = "비밀번호, 전화번호 설정 및 활성화")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "온보딩 완료"),
            @ApiResponse(responseCode = "400", description = "요청 파라미터 오류"),
            @ApiResponse(responseCode = "410", description = "토큰 유효하지 않음"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResultVO completeOnboarding(
            @PathVariable String tenantCode,
            @RequestBody(required = false) TenantOnboardingCompleteRequestVO requestVO) {
        try {
            if (!hasText(tenantCode)) {
                Map<String, Object> error = new HashMap<String, Object>();
                error.put("statusCode", "400");
                error.put("errorCode", "INVALID_TENANT_CODE");
                error.put("errorMessage", "tenantCode는 필수입니다.");
                return resultVoHelper.buildFromMap(error, ResponseCode.BUSINESS_ERROR);
            }

            if (requestVO == null
                    || !hasText(requestVO.getAuthToken()) || !hasText(requestVO.getPassword())) {
                Map<String, Object> error = new HashMap<String, Object>();
                error.put("statusCode", "400");
                error.put("errorCode", "MISSING_REQUIRED_FIELDS");
                error.put("errorMessage", "필수 항목이 누락되었습니다");
                return resultVoHelper.buildFromMap(error, ResponseCode.BUSINESS_ERROR);
            }

            tenantCode = tenantCode.trim();
            requestVO.setAuthToken(requestVO.getAuthToken().trim());
            requestVO.setPassword(requestVO.getPassword().trim());
            requestVO.setTenantCode(tenantCode);

            tenantOnboardingService.completeOnboarding(requestVO);

            Map<String, Object> result = new HashMap<String, Object>();
            result.put("tenantCode", tenantCode);
            result.put("completed", true);
            result.put("message", "온보딩이 완료되었습니다");

            return resultVoHelper.buildFromMap(result, ResponseCode.SUCCESS);

        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<String, Object>();
            error.put("statusCode", "400");
            error.put("errorCode", "INVALID_REQUEST");
            error.put("errorMessage", e.getMessage());
            return resultVoHelper.buildFromMap(error, ResponseCode.BUSINESS_ERROR);

        } catch (IllegalStateException e) {
            Map<String, Object> error = new HashMap<String, Object>();
            error.put("statusCode", "410");
            error.put("errorCode", "INVALID_ONBOARDING_STATE");
            error.put("errorMessage", e.getMessage());
            return resultVoHelper.buildFromMap(error, ResponseCode.BUSINESS_ERROR);

        } catch (Exception e) {
            log.error("온보딩 완료 중 오류 발생", e);

            Map<String, Object> error = new HashMap<String, Object>();
            error.put("statusCode", "500");
            error.put("errorCode", "INTERNAL_SERVER_ERROR");
            error.put("errorMessage", "서버 오류가 발생했습니다");
            return resultVoHelper.buildFromMap(error, ResponseCode.INTERNAL_SERVER_ERROR);
        }
    }

    private ResultVO buildMailConfigErrorResponse(String message) {
        Map<String, Object> error = new HashMap<String, Object>();
        error.put("statusCode", "503");
        error.put("errorCode", "MAIL_CONFIG_ERROR");
        error.put("errorMessage", message);
        return resultVoHelper.buildFromMap(error, ResponseCode.BUSINESS_ERROR);
    }

    private ResultVO buildMailAuthErrorResponse(String message) {
        Map<String, Object> error = new HashMap<String, Object>();
        error.put("statusCode", "502");
        error.put("errorCode", "MAIL_AUTH_ERROR");
        error.put("errorMessage", message);
        return resultVoHelper.buildFromMap(error, ResponseCode.BUSINESS_ERROR);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
