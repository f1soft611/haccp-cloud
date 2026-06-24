package egovframework.let.uat.uia.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.times;

import egovframework.com.cmm.LoginVO;
import egovframework.let.platforms.tenants.context.TenantContextHolder;
import egovframework.let.platforms.tenants.domain.model.TenantVO;
import egovframework.let.platforms.tenants.domain.repository.TenantInfoDAO;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class EgovLoginServiceImplTest {

	@AfterEach
	void clearTenantContext() {
		TenantContextHolder.clear();
	}

	@DisplayName("플랫폼 관리자 로그인은 tenantCode로 tenantId를 해석해 로그인할 수 있다")
	@Test
	void actionLogin_resolvesTenantIdForPlatformAdmin() throws Exception {
		LoginDAO loginDAO = mock(LoginDAO.class);
		TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
		EgovLoginServiceImpl service = new EgovLoginServiceImpl();
		ReflectionTestUtils.setField(service, "loginDAO", loginDAO);
		ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);

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
		verify(tenantInfoDAO).selectTenantIdByCode("PLATFORM");
		verify(loginDAO).actionLogin(eq(requestVO));
	}

	@DisplayName("루트 로그인은 도메인이 포함된 로그인 ID로 tenantId를 해석할 수 있다")
	@Test
	void actionLogin_resolvesTenantIdFromLoginIdDomain() throws Exception {
		LoginDAO loginDAO = mock(LoginDAO.class);
		TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
		EgovLoginServiceImpl service = new EgovLoginServiceImpl();
		ReflectionTestUtils.setField(service, "loginDAO", loginDAO);
		ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);

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
		EgovLoginServiceImpl service = new EgovLoginServiceImpl();
		ReflectionTestUtils.setField(service, "loginDAO", loginDAO);
		ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);

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
}