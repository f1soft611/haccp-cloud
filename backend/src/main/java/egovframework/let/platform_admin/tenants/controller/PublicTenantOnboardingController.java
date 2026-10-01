package egovframework.let.platform_admin.tenants.controller;

import java.util.HashMap;
import java.util.Map;

import javax.annotation.Resource;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.let.platform_admin.tenants.domain.model.TenantVerificationResponseVO;
import egovframework.let.platform_admin.tenants.service.TenantOnboardingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import static org.springframework.util.StringUtils.hasText;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "PublicTenantOnboardingController", description = "공개 온보딩 인증 API")
@RequiredArgsConstructor
@Slf4j
public class PublicTenantOnboardingController {

    private final TenantOnboardingService tenantOnboardingService;

    @Resource(name = "resultVoHelper")
    private ResultVoHelper resultVoHelper;

    @GetMapping("/onboarding/verify")
    @Operation(summary = "이메일 인증 링크 검증(공개)", description = "이메일 링크에서 토큰만으로 공개 검증")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "이메일 인증 성공"),
        @ApiResponse(responseCode = "400", description = "토큰 누락 또는 미존재"),
        @ApiResponse(responseCode = "410", description = "토큰 만료 또는 이미 사용"),
        @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResultVO verifyEmailTokenByGet(@RequestParam String token) {
        if (!hasText(token)) {
            Map<String, Object> error = new HashMap<>();
            error.put("statusCode", "400");
            error.put("errorCode", "INVALID_AUTH_TOKEN");
            error.put("errorMessage", "token은 필수입니다.");
            return resultVoHelper.buildFromMap(error, ResponseCode.BUSINESS_ERROR);
        }

        String authToken = token.trim();
        try {
            TenantVerificationResponseVO verification = tenantOnboardingService.verifyEmailToken(authToken);
            if (verification == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("statusCode", "400");
                error.put("errorCode", "INVALID_AUTH_TOKEN");
                error.put("errorMessage", "유효하지 않은 인증 토큰입니다.");
                return resultVoHelper.buildFromMap(error, ResponseCode.BUSINESS_ERROR);
            }

            Map<String, Object> result = new HashMap<>();
            result.put("tenantCode", verification.getTenantCode());
            result.put("verification", verification);
            result.put("message", "이메일 인증이 완료되었습니다");
            return resultVoHelper.buildFromMap(result, ResponseCode.SUCCESS);

        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("statusCode", "400");
            error.put("errorCode", "INVALID_AUTH_TOKEN");
            error.put("errorMessage", e.getMessage());
            return resultVoHelper.buildFromMap(error, ResponseCode.BUSINESS_ERROR);

        } catch (IllegalStateException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("statusCode", "410");
            error.put("errorCode", "AUTH_TOKEN_EXPIRED");
            error.put("errorMessage", e.getMessage());
            return resultVoHelper.buildFromMap(error, ResponseCode.BUSINESS_ERROR);

        } catch (Exception e) {
            log.error("이메일 인증 링크 검증 중 오류 발생", e);
            Map<String, Object> error = new HashMap<>();
            error.put("statusCode", "500");
            error.put("errorCode", "INTERNAL_SERVER_ERROR");
            error.put("errorMessage", "서버 오류가 발생했습니다");
            return resultVoHelper.buildFromMap(error, ResponseCode.INTERNAL_SERVER_ERROR);
        }
    }
}
