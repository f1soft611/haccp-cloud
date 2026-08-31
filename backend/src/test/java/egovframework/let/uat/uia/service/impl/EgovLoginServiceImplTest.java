package egovframework.let.uat.uia.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.times;

import egovframework.com.cmm.LoginVO;
import egovframework.let.platform_admin.loginhistory.domain.model.LoginHistory;
import egovframework.let.platform_admin.tenants.context.TenantContextHolder;
import egovframework.let.platform_admin.tenants.domain.model.TenantVO;
import egovframework.let.platform_admin.tenants.domain.repository.TenantInfoDAO;
import egovframework.let.platform_admin.tenants.service.TenantDatabaseRegistryService;
import egovframework.let.uat.uia.web.EgovLoginApiController;
import egovframework.let.utl.sim.service.EgovFileScrty;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class EgovLoginServiceImplTest {

	@AfterEach
	void clearTenantContext() {
		TenantContextHolder.clear();
	}

	@DisplayName("테넌트 코드가 TENANT_ 접두사를 포함해도 실제 tenantId를 올바르게 해석한다")
	@Test
	void actionLogin_resolvesTenantIdWhenTenantCodeHasPrefix() throws Exception {
		LoginDAO loginDAO = mock(LoginDAO.class);
		TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
		TenantDatabaseRegistryService tenantDatabaseRegistryService = mock(TenantDatabaseRegistryService.class);
		EgovLoginServiceImpl service = new EgovLoginServiceImpl();
		ReflectionTestUtils.setField(service, "loginDAO", loginDAO);
		ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);
		ReflectionTestUtils.setField(service, "tenantDatabaseRegistryService", tenantDatabaseRegistryService);
		when(tenantInfoDAO.selectTenantIdByCode("TENANT_0007")).thenReturn(null);
		when(tenantInfoDAO.selectTenantIdByCode("0007")).thenReturn(7L);
		when(tenantDatabaseRegistryService.resolveDbKeyByTenantId(7L)).thenReturn("TENANT_7");

		LoginVO storedLoginVO = new LoginVO();
		storedLoginVO.setId("tenant.admin.menucheck");
		storedLoginVO.setPassword("encoded-password");
		storedLoginVO.setTenantCode("0007");
		storedLoginVO.setRoleCode("TENANT_ADMIN");
		when(loginDAO.actionLogin(any(LoginVO.class))).thenReturn(storedLoginVO);

		LoginVO requestVO = new LoginVO();
		requestVO.setId("tenant.admin.menucheck");
		requestVO.setPassword("plain-password");
		requestVO.setTenantCode("TENANT_0007");
		requestVO.setRoleCode("TENANT_ADMIN");

		LoginVO result = service.actionLogin(requestVO);

		assertNotNull(result);
		assertEquals(Long.valueOf(7L), requestVO.getTenantId());
		assertEquals("0007", TenantContextHolder.getTenantCode());
		assertEquals("TENANT_7", TenantContextHolder.getDbKey());
		verify(tenantInfoDAO).selectTenantIdByCode("TENANT_0007");
		verify(tenantInfoDAO).selectTenantIdByCode("0007");
	}

	@DisplayName("테넌트 사용자 로그인은 tenant db key를 설정해 tenant DB로 로그인한다")
	@Test
	void actionLogin_setsTenantDbKeyForTenantUserLogin() throws Exception {
		LoginDAO loginDAO = mock(LoginDAO.class);
		TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
		TenantDatabaseRegistryService tenantDatabaseRegistryService = mock(TenantDatabaseRegistryService.class);
		EgovLoginServiceImpl service = new EgovLoginServiceImpl();
		ReflectionTestUtils.setField(service, "loginDAO", loginDAO);
		ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);
		ReflectionTestUtils.setField(service, "tenantDatabaseRegistryService", tenantDatabaseRegistryService);
		when(tenantDatabaseRegistryService.resolveDbKeyByTenantId(7L)).thenReturn("TENANT_7");

		TenantVO tenant = new TenantVO();
		tenant.setTenantId(7L);
		tenant.setTenantCode("TENANT_0007");
		when(tenantInfoDAO.selectByAdminEmailDomain("company.onhiworks.com")).thenReturn(tenant);

		LoginVO storedLoginVO = new LoginVO();
		storedLoginVO.setId("tenant_user@company.onhiworks.com");
		storedLoginVO.setPassword("encoded-password");
		storedLoginVO.setTenantCode("TENANT_0007");
		storedLoginVO.setRoleCode("TENANT_USER");
		when(loginDAO.actionLogin(any(LoginVO.class))).thenReturn(storedLoginVO);

		LoginVO requestVO = new LoginVO();
		requestVO.setId("tenant_user@company.onhiworks.com");
		requestVO.setPassword("plain-password");

		LoginVO result = service.actionLogin(requestVO);

		assertNotNull(result);
		assertEquals("0007", TenantContextHolder.getTenantCode());
		assertEquals("TENANT_7", TenantContextHolder.getDbKey());
		assertEquals(Long.valueOf(7L), requestVO.getTenantId());
		verify(tenantInfoDAO).selectByAdminEmailDomain("company.onhiworks.com");
		verify(loginDAO).actionLogin(eq(requestVO));
	}

	@DisplayName("플랫폼 관리자 로그인은 tenantCode로 tenantId를 해석해 로그인할 수 있다")
	@Test
	void actionLogin_resolvesTenantIdForPlatformAdmin() throws Exception {
		LoginDAO loginDAO = mock(LoginDAO.class);
		TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
		TenantDatabaseRegistryService tenantDatabaseRegistryService = mock(TenantDatabaseRegistryService.class);
		EgovLoginServiceImpl service = new EgovLoginServiceImpl();
		ReflectionTestUtils.setField(service, "loginDAO", loginDAO);
		ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);
		ReflectionTestUtils.setField(service, "tenantDatabaseRegistryService", tenantDatabaseRegistryService);
		when(tenantDatabaseRegistryService.resolveDbKeyByTenantId(1L)).thenReturn("TENANT_1");

		LoginVO storedLoginVO = new LoginVO();
		storedLoginVO.setId("platform_admin");
		storedLoginVO.setPassword("encoded-password");
		storedLoginVO.setTenantCode("PLATFORM");
		storedLoginVO.setRoleCode("PLATFORM_ADMIN");
		when(tenantInfoDAO.selectTenantIdByCode("PLATFORM")).thenReturn(1L);
		when(loginDAO.actionLogin(any(LoginVO.class))).thenReturn(storedLoginVO);

		LoginVO requestVO = new LoginVO();
		requestVO.setId("platform_admin");
		requestVO.setPassword("plain-password");
		requestVO.setTenantCode("PLATFORM");
		requestVO.setRoleCode("PLATFORM_ADMIN");

		LoginVO result = service.actionLogin(requestVO);

		assertNotNull(result);
		assertEquals("platform_admin", result.getId());
		assertEquals(Long.valueOf(1L), requestVO.getTenantId());
		assertEquals("PLATFORM", TenantContextHolder.getDbKey());
		verify(tenantInfoDAO).selectTenantIdByCode("PLATFORM");
		verify(loginDAO).actionLogin(eq(requestVO));
	}

	@DisplayName("플랫폼 관리자 로그인은 플랫폼 테넌트 메타데이터가 없어도 기본 플랫폼 tenantId로 처리한다")
	@Test
	void actionLogin_usesCanonicalPlatformTenantIdWhenPlatformMetadataMissing() throws Exception {
		LoginDAO loginDAO = mock(LoginDAO.class);
		TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
		TenantDatabaseRegistryService tenantDatabaseRegistryService = mock(TenantDatabaseRegistryService.class);
		EgovLoginServiceImpl service = new EgovLoginServiceImpl();
		ReflectionTestUtils.setField(service, "loginDAO", loginDAO);
		ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);
		ReflectionTestUtils.setField(service, "tenantDatabaseRegistryService", tenantDatabaseRegistryService);
		when(tenantInfoDAO.selectTenantIdByCode("PLATFORM")).thenReturn(null);
		when(tenantDatabaseRegistryService.resolveDbKeyByTenantId(1L)).thenReturn("PLATFORM");

		LoginVO storedLoginVO = new LoginVO();
		storedLoginVO.setId("socra710");
		storedLoginVO.setPassword("encoded-password");
		storedLoginVO.setTenantCode("PLATFORM");
		storedLoginVO.setRoleCode("PLATFORM_ADMIN");
		when(loginDAO.actionLogin(any(LoginVO.class))).thenReturn(storedLoginVO);

		LoginVO requestVO = new LoginVO();
		requestVO.setId("socra710");
		requestVO.setPassword("plain-password");
		requestVO.setTenantCode("PLATFORM");
		requestVO.setRoleCode("PLATFORM_ADMIN");

		LoginVO result = service.actionLogin(requestVO);

		assertNotNull(result);
		assertEquals(Long.valueOf(1L), requestVO.getTenantId());
		assertEquals("PLATFORM", TenantContextHolder.getDbKey());
		assertEquals("PLATFORM", TenantContextHolder.getTenantCode());
		verify(tenantInfoDAO).selectTenantIdByCode("PLATFORM");
	}

	@DisplayName("플랫폼 관리자 로그인은 레거시 tenantCode를 PLATFORM으로 정규화한다")
	@Test
	void actionLogin_normalizesLegacyPlatformTenantCode() throws Exception {
		LoginDAO loginDAO = mock(LoginDAO.class);
		TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
		TenantDatabaseRegistryService tenantDatabaseRegistryService = mock(TenantDatabaseRegistryService.class);
		EgovLoginServiceImpl service = new EgovLoginServiceImpl();
		ReflectionTestUtils.setField(service, "loginDAO", loginDAO);
		ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);
		ReflectionTestUtils.setField(service, "tenantDatabaseRegistryService", tenantDatabaseRegistryService);
		when(tenantInfoDAO.selectTenantIdByCode("PLATFORM")).thenReturn(1L);
		when(tenantDatabaseRegistryService.resolveDbKeyByTenantId(1L)).thenReturn("TENANT_1");

		LoginVO storedLoginVO = new LoginVO();
		storedLoginVO.setId("platform_admin");
		storedLoginVO.setPassword("encoded-password");
		storedLoginVO.setTenantCode("PLATFORM");
		storedLoginVO.setRoleCode("PLATFORM_ADMIN");
		when(loginDAO.actionLogin(any(LoginVO.class))).thenReturn(storedLoginVO);

		LoginVO requestVO = new LoginVO();
		requestVO.setId("platform_admin");
		requestVO.setPassword("plain-password");
		requestVO.setTenantCode("000001");
		requestVO.setRoleCode("PLATFORM_ADMIN");

		service.actionLogin(requestVO);

		assertEquals("PLATFORM", requestVO.getTenantCode());
		assertEquals("PLATFORM", TenantContextHolder.getTenantCode());
		assertEquals("PLATFORM", TenantContextHolder.getDbKey());
		verify(tenantInfoDAO).selectTenantIdByCode("PLATFORM");
	}

	@DisplayName("로그인 이력 생성은 요청에 tenant 정보가 비어 있어도 ThreadLocal 테넌트 컨텍스트를 사용한다")
	@Test
	void createLoginHistory_usesTenantContextWhenRequestMetadataIsMissing() throws Exception {
		EgovLoginApiController controller = new EgovLoginApiController();
		TenantContextHolder.setTenantId(9L);
		TenantContextHolder.setTenantCode("TENANT_0009");

		LoginVO requestVO = new LoginVO();
		requestVO.setId("tenant.admin.menucheck");
		requestVO.setRoleCode("TENANT_ADMIN");

		LoginHistory loginHistory = ReflectionTestUtils.invokeMethod(
				controller,
				"createLoginHistory",
				requestVO,
				null,
				"127.0.0.1",
				"Mozilla/5.0",
				"JWT"
		);

		assertNotNull(loginHistory);
		assertEquals(Long.valueOf(9L), loginHistory.getTenantId());
		assertEquals("0009", loginHistory.getTenantCode());
		assertEquals("tenant.admin.menucheck", loginHistory.getUserId());
		assertEquals("TENANT_ADMIN", loginHistory.getRoleCode());
	}

	@DisplayName("루트 로그인은 도메인이 포함된 로그인 ID로 tenantId를 해석할 수 있다")
	@Test
	void actionLogin_resolvesTenantIdFromLoginIdDomain() throws Exception {
		LoginDAO loginDAO = mock(LoginDAO.class);
		TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
		TenantDatabaseRegistryService tenantDatabaseRegistryService = mock(TenantDatabaseRegistryService.class);
		EgovLoginServiceImpl service = new EgovLoginServiceImpl();
		ReflectionTestUtils.setField(service, "loginDAO", loginDAO);
		ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);
		ReflectionTestUtils.setField(service, "tenantDatabaseRegistryService", tenantDatabaseRegistryService);
		when(tenantDatabaseRegistryService.resolveDbKeyByTenantId(7L)).thenReturn("TENANT_7");

		TenantVO tenant = new TenantVO();
		tenant.setTenantId(7L);
		when(tenantInfoDAO.selectByAdminEmailDomain("company.onhiworks.com")).thenReturn(tenant);

		LoginVO storedLoginVO = new LoginVO();
		storedLoginVO.setId("tenant_user@company.onhiworks.com");
		storedLoginVO.setPassword("encoded-password");
		when(loginDAO.actionLogin(any(LoginVO.class))).thenReturn(storedLoginVO);

		LoginVO requestVO = new LoginVO();
		requestVO.setId("tenant_user@company.onhiworks.com");
		requestVO.setPassword("plain-password");

		LoginVO result = service.actionLogin(requestVO);

		assertNotNull(result);
		assertEquals(Long.valueOf(7L), requestVO.getTenantId());
		verify(tenantInfoDAO).selectByAdminEmailDomain("company.onhiworks.com");
		verify(loginDAO).actionLogin(eq(requestVO));
	}

	@DisplayName("이메일 ID 로그인 실패 시 login_code salt로 재시도해 로그인할 수 있다")
	@Test
	void actionLogin_retriesWithLoginCodeSaltWhenEmailLoginFails() throws Exception {
		LoginDAO loginDAO = mock(LoginDAO.class);
		TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
		TenantDatabaseRegistryService tenantDatabaseRegistryService = mock(TenantDatabaseRegistryService.class);
		EgovLoginServiceImpl service = new EgovLoginServiceImpl();
		ReflectionTestUtils.setField(service, "loginDAO", loginDAO);
		ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);
		ReflectionTestUtils.setField(service, "tenantDatabaseRegistryService", tenantDatabaseRegistryService);
		when(tenantDatabaseRegistryService.resolveDbKeyByTenantId(1L)).thenReturn("TENANT_1");

		TenantVO tenant = new TenantVO();
		tenant.setTenantId(1L);
		when(tenantInfoDAO.selectByAdminEmailDomain("f1soft.co.kr")).thenReturn(tenant);
		when(loginDAO.selectLoginCodeByTenantIdAndEmail(1L, "socra710@f1soft.co.kr")).thenReturn("socra710");

		LoginVO storedLoginVO = new LoginVO();
		storedLoginVO.setId("socra710");
		storedLoginVO.setPassword("encoded-password");
		storedLoginVO.setTenantCode("PLATFORM");

		when(loginDAO.actionLogin(any(LoginVO.class))).thenReturn(null, storedLoginVO);

		LoginVO requestVO = new LoginVO();
		requestVO.setId("socra710@f1soft.co.kr");
		requestVO.setPassword("plain-password");

		LoginVO result = service.actionLogin(requestVO);

		assertNotNull(result);
		assertEquals("socra710", result.getId());
		assertEquals(Long.valueOf(1L), requestVO.getTenantId());
		verify(loginDAO, times(2)).actionLogin(eq(requestVO));
		verify(loginDAO).selectLoginCodeByTenantIdAndEmail(1L, "socra710@f1soft.co.kr");
	}

	@DisplayName("플랫폼 관리자 로그인은 실제 계정인 socra710을 우선으로 처리하고, platform_admin은 호환용 별칭으로 인정한다")
	@Test
	void actionLogin_prefersCanonicalPlatformAdminLoginCode() throws Exception {
		LoginDAO loginDAO = mock(LoginDAO.class);
		TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
		TenantDatabaseRegistryService tenantDatabaseRegistryService = mock(TenantDatabaseRegistryService.class);
		EgovLoginServiceImpl service = new EgovLoginServiceImpl();
		ReflectionTestUtils.setField(service, "loginDAO", loginDAO);
		ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);
		ReflectionTestUtils.setField(service, "tenantDatabaseRegistryService", tenantDatabaseRegistryService);
		when(tenantInfoDAO.selectTenantIdByCode("PLATFORM")).thenReturn(1L);
		when(tenantDatabaseRegistryService.resolveDbKeyByTenantId(1L)).thenReturn("PLATFORM");

		LoginVO storedLoginVO = new LoginVO();
		storedLoginVO.setId("socra710");
		storedLoginVO.setPassword("encoded-password");
		storedLoginVO.setTenantCode("PLATFORM");
		storedLoginVO.setRoleCode("PLATFORM_ADMIN");
		when(loginDAO.actionLogin(any(LoginVO.class))).thenReturn(null, storedLoginVO);

		LoginVO requestVO = new LoginVO();
		requestVO.setId("platform_admin");
		requestVO.setPassword("plain-password");
		requestVO.setTenantCode("PLATFORM");
		requestVO.setRoleCode("PLATFORM_ADMIN");

		LoginVO result = service.actionLogin(requestVO);

		assertNotNull(result);
		assertEquals("socra710", result.getId());
		assertEquals(Long.valueOf(1L), requestVO.getTenantId());
		verify(loginDAO, times(2)).actionLogin(eq(requestVO));
	}

	@DisplayName("테넌트 도메인 이메일 ID 로그인 실패 시 local-part login_code로 재시도해 로그인할 수 있다")
	@Test
	void actionLogin_retriesWithLocalPartLoginCodeWhenTenantDomainLoginUsesDifferentUserEmail() throws Exception {
		LoginDAO loginDAO = mock(LoginDAO.class);
		TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
		TenantDatabaseRegistryService tenantDatabaseRegistryService = mock(TenantDatabaseRegistryService.class);
		EgovLoginServiceImpl service = new EgovLoginServiceImpl();
		ReflectionTestUtils.setField(service, "loginDAO", loginDAO);
		ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);
		ReflectionTestUtils.setField(service, "tenantDatabaseRegistryService", tenantDatabaseRegistryService);
		when(tenantDatabaseRegistryService.resolveDbKeyByTenantId(3L)).thenReturn("TENANT_3");

		TenantVO tenant = new TenantVO();
		tenant.setTenantId(3L);
		when(tenantInfoDAO.selectByAdminEmailDomain("onbording4.co.kr")).thenReturn(tenant);
		when(loginDAO.selectLoginCodeByTenantIdAndEmail(3L, "socra710@onbording4.co.kr")).thenReturn(null);

		LoginVO storedLoginVO = new LoginVO();
		storedLoginVO.setId("socra710");
		storedLoginVO.setPassword("encoded-password");
		storedLoginVO.setTenantCode("2607030003");

		when(loginDAO.actionLogin(any(LoginVO.class))).thenReturn(null, storedLoginVO);

		LoginVO requestVO = new LoginVO();
		requestVO.setId("socra710@onbording4.co.kr");
		requestVO.setPassword("test-password");

		LoginVO result = service.actionLogin(requestVO);

		assertNotNull(result);
		assertEquals("socra710", result.getId());
		assertEquals(Long.valueOf(3L), requestVO.getTenantId());
		assertEquals("socra710", requestVO.getId());
		verify(loginDAO, times(2)).actionLogin(eq(requestVO));
		verify(loginDAO).selectLoginCodeByTenantIdAndEmail(3L, "socra710@onbording4.co.kr");
	}

	@DisplayName("임시 비밀번호(아이디 반복)로 로그인하면 mustChangePassword가 true로 설정된다")
	@Test
	void actionLogin_setsMustChangePasswordWhenPasswordMatchesTemporaryPattern() throws Exception {
		LoginDAO loginDAO = mock(LoginDAO.class);
		TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
		TenantDatabaseRegistryService tenantDatabaseRegistryService = mock(TenantDatabaseRegistryService.class);
		EgovLoginServiceImpl service = new EgovLoginServiceImpl();
		ReflectionTestUtils.setField(service, "loginDAO", loginDAO);
		ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);
		ReflectionTestUtils.setField(service, "tenantDatabaseRegistryService", tenantDatabaseRegistryService);
		when(tenantInfoDAO.selectTenantIdByCode("TENANT1")).thenReturn(7L);
		when(tenantDatabaseRegistryService.resolveDbKeyByTenantId(7L)).thenReturn("TENANT_7");

		String temporaryPasswordHash = EgovFileScrty.encryptPassword("hong123hong123", "hong123");

		LoginVO storedLoginVO = new LoginVO();
		storedLoginVO.setId("hong123");
		storedLoginVO.setPassword(temporaryPasswordHash);
		storedLoginVO.setTenantCode("TENANT1");
		storedLoginVO.setRoleCode("TENANT_USER");
		when(loginDAO.actionLogin(any(LoginVO.class))).thenReturn(storedLoginVO);

		LoginVO requestVO = new LoginVO();
		requestVO.setId("hong123");
		requestVO.setPassword("hong123hong123");
		requestVO.setTenantCode("TENANT1");
		requestVO.setRoleCode("TENANT_USER");

		LoginVO result = service.actionLogin(requestVO);

		assertNotNull(result);
		assertTrue(result.isMustChangePassword());
	}

	@DisplayName("실제 비밀번호로 로그인하면 mustChangePassword가 false로 유지된다")
	@Test
	void actionLogin_keepsMustChangePasswordFalseForRealPassword() throws Exception {
		LoginDAO loginDAO = mock(LoginDAO.class);
		TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
		TenantDatabaseRegistryService tenantDatabaseRegistryService = mock(TenantDatabaseRegistryService.class);
		EgovLoginServiceImpl service = new EgovLoginServiceImpl();
		ReflectionTestUtils.setField(service, "loginDAO", loginDAO);
		ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);
		ReflectionTestUtils.setField(service, "tenantDatabaseRegistryService", tenantDatabaseRegistryService);
		when(tenantInfoDAO.selectTenantIdByCode("TENANT1")).thenReturn(7L);
		when(tenantDatabaseRegistryService.resolveDbKeyByTenantId(7L)).thenReturn("TENANT_7");

		LoginVO storedLoginVO = new LoginVO();
		storedLoginVO.setId("hong123");
		storedLoginVO.setPassword("some-real-encoded-password");
		storedLoginVO.setTenantCode("TENANT1");
		storedLoginVO.setRoleCode("TENANT_USER");
		when(loginDAO.actionLogin(any(LoginVO.class))).thenReturn(storedLoginVO);

		LoginVO requestVO = new LoginVO();
		requestVO.setId("hong123");
		requestVO.setPassword("real-password");
		requestVO.setTenantCode("TENANT1");
		requestVO.setRoleCode("TENANT_USER");

		LoginVO result = service.actionLogin(requestVO);

		assertNotNull(result);
		assertFalse(result.isMustChangePassword());
	}
}