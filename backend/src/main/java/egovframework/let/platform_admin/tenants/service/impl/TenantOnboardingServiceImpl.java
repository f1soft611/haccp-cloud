package egovframework.let.platform_admin.tenants.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.mail.internet.MimeMessage;

import egovframework.let.platform_admin.tenants.domain.model.TenantAuthTokenVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantOnboardingCompleteRequestVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantVerificationResponseVO;
import egovframework.let.platform_admin.tenants.domain.repository.TenantAuthTokenDAO;
import egovframework.let.platform_admin.tenants.domain.repository.TenantInfoDAO;
import egovframework.let.platform_admin.tenants.service.TenantOnboardingService;
import egovframework.let.platform_admin.tenants.service.exception.MailAuthenticationFailureException;
import egovframework.let.platform_admin.tenants.service.exception.MailConfigurationException;
import egovframework.let.organization.authorities.domain.model.AuthorityMenuSaveRequestVO;
import egovframework.let.organization.authorities.service.AuthorityService;
import egovframework.let.organization.users.domain.repository.PlatformUserDAO;
import egovframework.let.uss.auth.service.RoleInfoVO;
import egovframework.let.utl.sim.service.EgovFileScrty;
import lombok.extern.slf4j.Slf4j;

/**
 * 테넌트 온보딩 서비스 구현체
 * @author SHMT-MES
 * @since 2026.06.23
 * @version 1.0
 * @see
 *
 * <pre>
 * << 개정이력(Modification Information) >>
 *
 *   수정일      수정자           수정내용
 *  -------    --------    ---------------------------
 *   2026.06.23 SHMT-MES          최초 생성
 *
 * </pre>
 */
@Service("tenantOnboardingService")
@Slf4j
public class TenantOnboardingServiceImpl implements TenantOnboardingService {

    private static final String DOMAIN_PATTERN = "^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$";
    private static final int MAX_LOGO_IMAGE_LENGTH = 4_000_000;

    @Autowired
    private TenantAuthTokenDAO tenantAuthTokenDAO;

    @Autowired
    private TenantInfoDAO tenantInfoDAO;

    @Autowired
    private PlatformUserDAO platformUserDAO;

    @Autowired
    private AuthorityService authorityService;

    @Autowired(required = false)
    private JavaMailSender javaMailSender;

    @Value("${mail.from.address:no-reply@haccpcloud.local}")
    private String fromEmail;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${onboarding.verify.base-url:https://haccp-cloud.vercel.app}")
    private String onboardingVerifyBaseUrl;

    /**
     * Task 11: 이메일 인증 토큰 생성 및 발송
     */
    @Override
    public void createAndSendVerificationEmail(String tenantCode, String loginAccountId, String adminEmail, String adminName) {
        String normalizedTenantCode = normalizeStorageTenantCode(tenantCode);
        Long tenantId = tenantInfoDAO.selectTenantIdByCode(normalizedTenantCode);
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트가 존재하지 않습니다: " + tenantCode);
        }
        String tenantNm = tenantInfoDAO.selectTenantNameByCode(normalizedTenantCode);

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

        sendVerificationEmail(adminEmail, tenantCode, tenantNm, authToken);

        tenantInfoDAO.updateOnboardingStatusByTenantCode(normalizedTenantCode, "EMAIL_SENT");

        log.info("인증 이메일 발송 완료: tenantCode={}, adminEmail={}", tenantCode, adminEmail);
    }

    @Override
    @Transactional
    public void dispatchVerificationEmail(String tenantCode, String adminName) {
        String normalizedTenantCode = normalizeStorageTenantCode(tenantCode);
        String adminEmail = tenantInfoDAO.selectAdminEmailByTenantCode(normalizedTenantCode);
        Long loginAccountId = tenantInfoDAO.selectLatestLoginAccountIdByTenantCode(normalizedTenantCode);

        if (adminEmail == null || adminEmail.trim().isEmpty()) {
            throw new IllegalStateException("관리자 이메일 정보를 찾을 수 없습니다. tenantCode=" + tenantCode);
        }
        if (loginAccountId == null) {
            loginAccountId = ensureBootstrapLoginAccount(normalizedTenantCode, adminEmail, adminName);
        }

        createAndSendVerificationEmail(normalizedTenantCode, String.valueOf(loginAccountId), adminEmail, adminName);
    }

    private Long ensureBootstrapLoginAccount(String tenantCode, String adminEmail, String adminName) {
        Long tenantId = tenantInfoDAO.selectTenantIdByCode(tenantCode);
        if (tenantId == null) {
            throw new IllegalStateException("테넌트가 존재하지 않습니다. tenantCode=" + tenantCode);
        }

        String baseLoginCode = buildBootstrapLoginCodeBase(adminEmail);
        for (int attempt = 0; attempt < 10; attempt++) {
            String loginCode = buildBootstrapLoginCodeCandidate(baseLoginCode, attempt);
            Map<String, Object> condition = new HashMap<String, Object>();
            condition.put("tenantId", tenantId);
            condition.put("loginCode", loginCode);

            Long existingLoginId;
            try {
                existingLoginId = platformUserDAO.selectLoginIdByLoginCode(condition);
            } catch (Exception ex) {
                throw new IllegalStateException("로그인 계정 조회 중 오류가 발생했습니다.", ex);
            }
            if (existingLoginId != null) {
                return existingLoginId;
            }

            Map<String, Object> loginPayload = new HashMap<String, Object>();
            loginPayload.put("tenantId", tenantId);
            loginPayload.put("loginCode", loginCode);
            loginPayload.put("passwordHash", buildBootstrapPasswordHash(loginCode));
            // 인증 완료 전에는 로그인 불가 상태로 계정을 미리 생성한다.
            loginPayload.put("useAt", "N");

            try {
                platformUserDAO.insertLoginAccount(loginPayload);
                Long createdLoginId = platformUserDAO.selectLoginIdByLoginCode(condition);
                if (createdLoginId != null) {
                    ensureBootstrapAdminUser(tenantId, createdLoginId, adminEmail, adminName);
                    return createdLoginId;
                }
            } catch (Exception ex) {
                log.warn("부트스트랩 로그인 계정 생성 충돌: tenantCode={}, loginCode={}, reason={}",
                        tenantCode,
                        loginCode,
                        ex.getMessage());
            }
        }

        throw new IllegalStateException("로그인 계정 정보를 찾을 수 없습니다. tenantCode=" + tenantCode);
    }

    private void ensureBootstrapAdminUser(Long tenantId, Long loginAccountId, String adminEmail, String adminName) {
        Map<String, Object> condition = new HashMap<String, Object>();
        condition.put("tenantId", tenantId);
        condition.put("loginId", loginAccountId);

        Long userId;
        try {
            userId = platformUserDAO.selectUserIdByLoginId(condition);
        } catch (Exception ex) {
            throw new IllegalStateException("관리자 사용자 조회 중 오류가 발생했습니다.", ex);
        }

        Map<String, Object> payload = new HashMap<String, Object>();
        payload.put("tenantId", tenantId);
        payload.put("loginId", loginAccountId);
        payload.put("userNm", resolveBootstrapAdminName(adminName, adminEmail));
        payload.put("emailAddr", isBlank(adminEmail) ? null : adminEmail.trim());
        payload.put("departmentId", null);
        payload.put("useAt", "Y");

        try {
            if (userId == null) {
                platformUserDAO.insertUser(payload);
            } else {
                payload.put("userId", userId);
                platformUserDAO.updateUser(payload);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("관리자 사용자 저장 중 오류가 발생했습니다.", ex);
        }
    }

    private String buildBootstrapPasswordHash(String loginCode) {
        String tempPassword = TenantAuthTokenGenerator.generateToken();
        try {
            return EgovFileScrty.encryptPassword(tempPassword, loginCode);
        } catch (Exception ex) {
            throw new IllegalStateException("부트스트랩 비밀번호 생성에 실패했습니다.", ex);
        }
    }

    private String buildBootstrapLoginCodeBase(String adminEmail) {
        if (isBlank(adminEmail)) {
            return "tenant.admin";
        }

        String trimmed = adminEmail.trim();
        int atIndex = trimmed.indexOf('@');
        String localPart = atIndex > 0 ? trimmed.substring(0, atIndex) : trimmed;
        String normalized = localPart.toLowerCase().replaceAll("[^a-z0-9._-]", "");
        if (normalized.isEmpty()) {
            return "tenant.admin";
        }
        if (normalized.length() > 90) {
            return normalized.substring(0, 90);
        }
        return normalized;
    }

    private String buildBootstrapLoginCodeCandidate(String baseLoginCode, int attempt) {
        if (attempt <= 0) {
            return baseLoginCode;
        }

        String suffix = "." + attempt;
        int maxBaseLength = 100 - suffix.length();
        String adjustedBase = baseLoginCode.length() > maxBaseLength
                ? baseLoginCode.substring(0, maxBaseLength)
                : baseLoginCode;
        return adjustedBase + suffix;
    }

    /**
     * Task 12: 이메일 인증 토큰 검증
     */
    @Override
    @Transactional
    public TenantVerificationResponseVO verifyEmailToken(String tenantCode, String authToken) {
        String normalizedTenantCode = normalizeStorageTenantCode(tenantCode);
        TenantVerificationResponseVO responseVO = verifyEmailToken(authToken);
        if (!normalizedTenantCode.equals(responseVO.getTenantCode())) {
            throw new IllegalArgumentException("요청 테넌트와 인증 토큰의 테넌트가 일치하지 않습니다");
        }
        return responseVO;
    }

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

        if (tokenVO.getLoginAccountId() != null) {
            tenantInfoDAO.updateLoginAccountOnboardingStatus(tokenVO.getLoginAccountId(), "EMAIL_VERIFIED");
        }

        String tenantNm = tenantInfoDAO.selectTenantNameByCode(tokenVO.getTenantCode());
        String adminEmail = tenantInfoDAO.selectAdminEmailByLoginAccountId(tokenVO.getLoginAccountId());
        String adminLoginCode = tenantInfoDAO.selectLoginCodeByLoginAccountId(tokenVO.getLoginAccountId());

        TenantVerificationResponseVO responseVO = TenantVerificationResponseVO.builder()
                .tenantCode(tokenVO.getTenantCode())
                .tenantNm(tenantNm)
                .adminEmail(adminEmail)
                .loginAccountId(tokenVO.getLoginAccountId())
            .adminLoginCode(adminLoginCode)
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

        String tenantCode = normalizeStorageTenantCode(requestVO.getTenantCode());
        String authToken = requestVO.getAuthToken().trim();
        String password = requestVO.getPassword();
        String loginDomain = normalizeDomain(requestVO.getLoginDomain());
        String logoImage = normalizeLogoImage(requestVO.getLogoImage());

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

        Long tenantId = tenantInfoDAO.selectTenantIdByCode(tenantCode);
        if (tenantId == null) {
            throw new IllegalStateException("테넌트가 존재하지 않습니다");
        }

        if (!isBlank(loginDomain)) {
            validateDomainAvailability(loginDomain, tenantId);
        }

        String loginCode = tenantInfoDAO.selectLoginCodeByLoginAccountId(loginAccountId);
        if (isBlank(loginCode)) {
            throw new IllegalStateException("로그인 계정 정보를 찾을 수 없습니다");
        }

        String encodedPassword;
        try {
            encodedPassword = EgovFileScrty.encryptPassword(password, loginCode);
        } catch (Exception e) {
            throw new IllegalStateException("비밀번호 암호화에 실패했습니다", e);
        }
        int updatedLoginAccountCount = tenantInfoDAO.updateLoginAccountPasswordAndActivate(
                loginAccountId,
                encodedPassword,
            "SHA-512",
                "Y",
                "FIRST_SETUP_COMPLETED");
        if (updatedLoginAccountCount <= 0) {
            throw new IllegalStateException("로그인 계정이 존재하지 않습니다");
        }

        provisionTenantAuthorityForOnboarding(tenantCode, tenantId, loginAccountId);

        if (requestVO.getPhoneNumber() != null) {
            tenantInfoDAO.updateUserMobileNoByLoginAccountId(loginAccountId, requestVO.getPhoneNumber());
        }

        if (!isBlank(loginDomain)) {
            tenantInfoDAO.demotePrimaryDomainByTenantId(tenantId);
            int updated = tenantInfoDAO.activateTenantDomain(tenantId, loginDomain);
            if (updated <= 0) {
                tenantInfoDAO.insertTenantDomain(tenantId, loginDomain);
            }
        }

        if (logoImage != null) {
            tenantInfoDAO.updateLogoImage(tenantId, logoImage);
        }

        tenantInfoDAO.updateOnboardingStatusByTenantCode(tenantCode, "ACTIVE");

        tenantAuthTokenDAO.markTokenAsUsed(authToken);

        log.info("온보딩 완료: tenantCode={}, loginAccountId={}", tenantCode, loginAccountId);
    }

    private void provisionTenantAuthorityForOnboarding(String tenantCode, Long tenantId, Long loginAccountId) {
        String adminEmail = tenantInfoDAO.selectAdminEmailByTenantCode(tenantCode);
        String tenantNm = tenantInfoDAO.selectTenantNameByCode(tenantCode);

        Long tenantAdminRoleId = ensureTenantRole(tenantId, tenantCode, "TENANT_ADMIN", "업체 관리자");
        ensureTenantRole(tenantId, tenantCode, "TENANT_USER", "업체 사용자");

        ensureTenantAdminUser(tenantId, loginAccountId, adminEmail, tenantNm);
        replaceLoginAccountRole(loginAccountId, tenantAdminRoleId);

        List<String> allowedMenuCodes = resolveAllowedMenuCodesByPlan(tenantCode);
        replaceRoleMenusByCode("TENANT_ADMIN", tenantCode, allowedMenuCodes);
        replaceRoleMenusByCode("TENANT_USER", tenantCode, new ArrayList<String>());
    }

    private Long ensureTenantRole(Long tenantId, String tenantCode, String roleCode, String roleName) {
        Long roleId = findRoleId(tenantId, roleCode);
        if (roleId != null) {
            return roleId;
        }

        RoleInfoVO payload = new RoleInfoVO();
        payload.setTenantCode(tenantCode);
        payload.setRoleCode(roleCode);
        payload.setRoleNm(roleName);
        payload.setUseAt("Y");
        payload.setSystemRoleYn("Y");
        payload.setFrstRegisterId("system");
        payload.setLastUpdusrId("system");

        try {
            authorityService.createRole(payload);
        } catch (Exception ex) {
            throw new IllegalStateException("기본 권한 생성 중 오류가 발생했습니다. roleCode=" + roleCode, ex);
        }

        Long createdRoleId = findRoleId(tenantId, roleCode);
        if (createdRoleId == null) {
            throw new IllegalStateException("기본 권한 생성 결과를 확인할 수 없습니다. roleCode=" + roleCode);
        }
        return createdRoleId;
    }

    private Long findRoleId(Long tenantId, String roleCode) {
        Map<String, Object> condition = new HashMap<String, Object>();
        condition.put("tenantId", tenantId);
        condition.put("roleCode", roleCode);
        try {
            return platformUserDAO.selectRoleIdByCode(condition);
        } catch (Exception ex) {
            throw new IllegalStateException("권한 조회 중 오류가 발생했습니다. roleCode=" + roleCode, ex);
        }
    }

    private void ensureTenantAdminUser(Long tenantId, Long loginAccountId, String adminEmail, String tenantNm) {
        Map<String, Object> condition = new HashMap<String, Object>();
        condition.put("tenantId", tenantId);
        condition.put("loginId", loginAccountId);

        Long userId;
        try {
            userId = platformUserDAO.selectUserIdByLoginId(condition);
        } catch (Exception ex) {
            throw new IllegalStateException("관리자 사용자 조회 중 오류가 발생했습니다.", ex);
        }

        if (userId != null) {
            return;
        }

        Map<String, Object> payload = new HashMap<String, Object>();
        payload.put("tenantId", tenantId);
        payload.put("loginId", loginAccountId);
        payload.put("userNm", resolveBootstrapAdminName(null, adminEmail));
        payload.put("emailAddr", isBlank(adminEmail) ? null : adminEmail.trim());
        payload.put("departmentId", null);
        payload.put("useAt", "Y");

        try {
            platformUserDAO.insertUser(payload);
        } catch (Exception ex) {
            throw new IllegalStateException("관리자 사용자 생성 중 오류가 발생했습니다.", ex);
        }
    }

    private String resolveBootstrapAdminName(String adminName, String adminEmail) {
        if (!isBlank(adminName)) {
            return adminName.trim();
        }

        if (!isBlank(adminEmail)) {
            String trimmed = adminEmail.trim();
            int atIndex = trimmed.indexOf('@');
            if (atIndex > 0) {
                String local = trimmed.substring(0, atIndex).trim();
                if (!local.isEmpty()) {
                    return local;
                }
            }
            return trimmed;
        }

        return "업체 관리자";
    }

    private void replaceLoginAccountRole(Long loginAccountId, Long roleId) {
        try {
            platformUserDAO.deleteLoginAccountRolesByLoginId(loginAccountId);

            Map<String, Object> payload = new HashMap<String, Object>();
            payload.put("loginId", loginAccountId);
            payload.put("roleId", roleId);
            platformUserDAO.insertLoginAccountRole(payload);
        } catch (Exception ex) {
            throw new IllegalStateException("관리자 권한 매핑 중 오류가 발생했습니다.", ex);
        }
    }

    private List<String> resolveAllowedMenuCodesByPlan(String tenantCode) {
        try {
            return authorityService.listAllowedMenuCodesByTenantPlan(tenantCode);
        } catch (Exception ex) {
            throw new IllegalStateException("플랜별 메뉴 조회 중 오류가 발생했습니다.", ex);
        }
    }

    private void replaceRoleMenusByCode(String roleCode, String tenantCode, List<String> menuCodes) {
        AuthorityMenuSaveRequestVO payload = new AuthorityMenuSaveRequestVO();
        payload.setRoleCode(roleCode);
        payload.setMenuIds(menuCodes == null ? new ArrayList<String>() : menuCodes);

        try {
            authorityService.replaceRoleMenus(roleCode, tenantCode, payload);
        } catch (Exception ex) {
            throw new IllegalStateException("권한-메뉴 매핑 저장 중 오류가 발생했습니다. roleCode=" + roleCode, ex);
        }
    }

    private void validateDomainAvailability(String loginDomain, Long tenantId) {
        if (!loginDomain.matches(DOMAIN_PATTERN)) {
            throw new IllegalArgumentException("유효한 도메인 형식이 아닙니다");
        }

        Long existingTenantId = tenantInfoDAO.selectTenantIdByEmailDomain(loginDomain);
        if (existingTenantId != null && !existingTenantId.equals(tenantId)) {
            throw new IllegalStateException("이미 사용 중인 도메인입니다");
        }
    }

    private String normalizeDomain(String domain) {
        if (domain == null) {
            return null;
        }

        String normalized = domain.trim().toLowerCase();
        if (normalized.startsWith("http://")) {
            normalized = normalized.substring(7);
        } else if (normalized.startsWith("https://")) {
            normalized = normalized.substring(8);
        }

        if (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }

        return normalized;
    }

    private String normalizeLogoImage(String logoImage) {
        if (logoImage == null) {
            return null;
        }

        String normalized = logoImage.trim();
        if (normalized.isEmpty()) {
            return null;
        }
        if (normalized.length() > MAX_LOGO_IMAGE_LENGTH) {
            throw new IllegalArgumentException("로고 이미지 크기가 너무 큽니다");
        }
        return normalized;
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

        if (loginAccountId == null) {
            loginAccountId = tenantInfoDAO.selectLatestLoginAccountIdByTenantCode(normalizedTenantCode);
        }

        if (adminEmail == null && loginAccountId != null) {
            adminEmail = tenantInfoDAO.selectAdminEmailByLoginAccountId(loginAccountId);
        }

        if (isBlank(adminEmail)) {
            adminEmail = tenantInfoDAO.selectAdminEmailByTenantCode(normalizedTenantCode);
        }

        if (loginAccountId == null || isBlank(adminEmail)) {
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

        String tenantNm = tenantInfoDAO.selectTenantNameByCode(normalizedTenantCode);
        sendVerificationEmail(adminEmail, tenantCode, tenantNm, newAuthToken);

        tenantInfoDAO.updateOnboardingStatusByTenantCode(normalizedTenantCode, "EMAIL_SENT");

        log.info("인증 이메일 재발송 완료: tenantCode={}, adminEmail={}", tenantCode, adminEmail);
    }

    /**
     * Helper: 이메일 발송
     */
    private void sendVerificationEmail(String toEmail, String tenantCode, String tenantNm, String authToken) {
        try {
            if (javaMailSender == null) {
                throw new MailConfigurationException("메일 발송 설정이 없습니다. JavaMailSender 빈을 구성해주세요.");
            }
            if (isBlank(mailUsername) || isBlank(mailPassword)) {
                throw new MailConfigurationException("SMTP 인증 정보가 누락되었습니다. MAIL_USERNAME, MAIL_PASSWORD 환경변수를 설정해주세요.");
            }
            if (isBlank(fromEmail)) {
                throw new MailConfigurationException("발신자 메일 주소가 누락되었습니다. MAIL_FROM_ADDRESS를 설정해주세요.");
            }

            String verificationUrl = buildVerificationUrl(authToken);
            String htmlBody = buildVerificationEmailHtml(tenantCode, tenantNm, verificationUrl);

            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("[HACCP Cloud] 업체 온보딩 인증 이메일");
            helper.setText(htmlBody, true);

            javaMailSender.send(message);
        } catch (MailAuthenticationException e) {
            log.error("SMTP 인증 실패: username='{}'", mailUsername, e);
            throw new MailAuthenticationFailureException("SMTP 인증에 실패했습니다. MAIL_USERNAME/MAIL_PASSWORD 값을 확인해주세요.", e);
        } catch (Exception e) {
            log.error("이메일 발송 실패: {}", toEmail, e);
            throw new RuntimeException("이메일 발송 실패", e);
        }
    }

    private String buildVerificationEmailHtml(String tenantCode, String tenantNm, String verificationUrl) {
        return "<!doctype html>"
                + "<html lang=\"ko\">"
                + "<head>"
                + "<meta charset=\"UTF-8\" />"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />"
                + "<title>HACCP Cloud 인증 이메일</title>"
                + "</head>"
                + "<body style=\"margin:0;padding:0;background:#f4f7fb;font-family:'Segoe UI',Arial,sans-serif;color:#1f2937;\">"
                + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"padding:32px 12px;\">"
                + "<tr><td align=\"center\">"
                + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:640px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,0.12);\">"
                + "<tr><td style=\"padding:26px 30px;background:linear-gradient(135deg,#0b6ef3,#00a2c7);color:#ffffff;\">"
                + "<div style=\"font-size:13px;opacity:0.9;letter-spacing:0.08em;\">HACCP CLOUD</div>"
                + "<h1 style=\"margin:8px 0 0;font-size:24px;line-height:1.3;\">업체 온보딩 인증 안내</h1>"
                + "</td></tr>"
                + "<tr><td style=\"padding:28px 30px 22px;\">"
                + "<p style=\"margin:0 0 14px;font-size:15px;line-height:1.7;\">안녕하세요.<br/>" + escapeHtml(tenantNm) + " 업체의 온보딩 인증을 완료해주세요.</p>"
                + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin:16px 0 20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;\">"
                + "<tr><td style=\"padding:14px 16px;\">"
                + "<div style=\"font-size:12px;color:#64748b;\">업체명</div>"
                + "<div style=\"margin-top:4px;font-size:16px;font-weight:700;color:#0f172a;\">" + escapeHtml(tenantNm) + "</div>"
                + "</td></tr>"
                + "<tr><td style=\"padding:0 16px 14px;\">"
                + "<div style=\"font-size:12px;color:#64748b;\">테넌트 코드</div>"
                + "<div style=\"margin-top:4px;font-size:16px;font-weight:700;color:#0f172a;\">" + escapeHtml(tenantCode) + "</div>"
                + "</td></tr>"
                + "</table>"
                + "<div style=\"text-align:center;margin:18px 0 22px;\">"
                + "<a href=\"" + escapeHtml(verificationUrl) + "\" style=\"display:inline-block;background:#0b6ef3;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:9px;\">인증 링크 열기</a>"
                + "</div>"
                + "<p style=\"margin:0 0 8px;font-size:13px;color:#475569;\">버튼이 동작하지 않으면 아래 링크를 복사해 브라우저에 붙여넣어 주세요.</p>"
                + "<p style=\"margin:0 0 10px;word-break:break-all;font-size:12px;color:#0b6ef3;\">" + escapeHtml(verificationUrl) + "</p>"
                + "<p style=\"margin:0;font-size:12px;color:#ef4444;\">유효시간: 24시간</p>"
                + "</td></tr>"
                + "<tr><td style=\"padding:16px 30px;background:#f8fafc;border-top:1px solid #e5e7eb;\">"
                + "<p style=\"margin:0;font-size:11px;color:#64748b;line-height:1.6;\">본 메일은 발신 전용입니다. 문의가 필요한 경우 시스템 관리자에게 연락해주세요.</p>"
                + "</td></tr>"
                + "</table>"
                + "</td></tr>"
                + "</table>"
                + "</body>"
                + "</html>";
    }

    private String buildVerificationUrl(String authToken) {
        String baseUrl = onboardingVerifyBaseUrl == null ? "" : onboardingVerifyBaseUrl.trim();
        if (baseUrl.isEmpty()) {
            baseUrl = "https://haccp-cloud.vercel.app";
        }

        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }

        return baseUrl + "/onboarding/verify?token=" + authToken;
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#x27;");
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
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