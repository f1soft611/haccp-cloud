package egovframework.com.config;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.Method;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.aop.PointcutAdvisor;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;

import egovframework.let.platform_admin.tenants.service.impl.PlatformTenantServiceImpl;
import egovframework.let.uat.uia.service.impl.EgovLoginServiceImpl;

class EgovConfigAppTransactionTest {

	@DisplayName("로그인 조회는 테넌트 컨텍스트 설정 전에 트랜잭션 커넥션을 선점하지 않도록 전역 트랜잭션 대상에서 제외한다")
	@Test
	void txAdvisor_doesNotWrapLoginActionLogin() throws Exception {
		EgovConfigAppTransaction config = new EgovConfigAppTransaction();
		PointcutAdvisor advisor = (PointcutAdvisor) config.txAdvisor(new DataSourceTransactionManager());

		Method actionLogin = EgovLoginServiceImpl.class.getMethod("actionLogin", egovframework.com.cmm.LoginVO.class);
		Method registerTenant = PlatformTenantServiceImpl.class.getMethod(
				"registerTenant",
				egovframework.let.platform_admin.tenants.domain.model.TenantRegistrationRequestVO.class);

		assertFalse(advisor.getPointcut().getMethodMatcher().matches(actionLogin, EgovLoginServiceImpl.class));
		assertTrue(advisor.getPointcut().getMethodMatcher().matches(registerTenant, PlatformTenantServiceImpl.class));
	}
}