package egovframework.let.organization.users.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.Map;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import egovframework.let.organization.users.domain.model.PlatformUserPasswordChangeRequestVO;
import egovframework.let.organization.users.domain.model.PlatformUserSearchConditionVO;
import egovframework.let.organization.users.domain.model.PlatformUserVO;
import egovframework.let.organization.users.domain.repository.PlatformUserDAO;
import egovframework.let.platform_admin.tenants.context.TenantContextHolder;
import egovframework.let.utl.sim.service.EgovFileScrty;

class PlatformUserServiceImplTest {

    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    @DisplayName("검색어를 전달하면 조회 조건의 keyword 필드에 그대로 반영된다")
    @Test
    void listUsersPaged_appliesKeywordToSearchCondition() throws Exception {
        PlatformUserDAO platformUserDAO = mock(PlatformUserDAO.class);
        when(platformUserDAO.selectUserPagedList(any())).thenReturn(Collections.emptyList());
        when(platformUserDAO.selectUserPagedCount(any())).thenReturn(0);

        PlatformUserServiceImpl service = new PlatformUserServiceImpl();
        ReflectionTestUtils.setField(service, "platformUserDAO", platformUserDAO);

        service.listUsersPaged(1, 10, "홍길동", "all", "TENANT1");

        ArgumentCaptor<PlatformUserSearchConditionVO> captor =
                ArgumentCaptor.forClass(PlatformUserSearchConditionVO.class);
        verify(platformUserDAO).selectUserPagedList(captor.capture());

        assertEquals("홍길동", captor.getValue().getKeyword());
    }

    @DisplayName("비밀번호 초기화는 로그인아이디를 반복한 값을 임시 비밀번호로 암호화하여 저장한다")
    @Test
    void resetPassword_setsTempPasswordFromLoginCode() throws Exception {
        PlatformUserDAO platformUserDAO = mock(PlatformUserDAO.class);
        PlatformUserServiceImpl service = new PlatformUserServiceImpl();
        ReflectionTestUtils.setField(service, "platformUserDAO", platformUserDAO);

        when(platformUserDAO.selectTenantIdByCode("TENANT1")).thenReturn(5L);

        PlatformUserVO user = new PlatformUserVO();
        user.setLoginId(42L);
        user.setLoginCode("hong123");
        when(platformUserDAO.selectUserDetail(any())).thenReturn(user);

        String tempPassword = service.resetPassword(9L, "TENANT1");

        assertEquals("hong123hong123", tempPassword);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> captor = ArgumentCaptor.forClass(Map.class);
        verify(platformUserDAO).updateLoginPasswordHash(captor.capture());
        assertEquals(42L, captor.getValue().get("loginId"));
        assertEquals(
                EgovFileScrty.encryptPassword("hong123hong123", "hong123"),
                captor.getValue().get("passwordHash"));
    }

    @DisplayName("새 비밀번호에 로그인 아이디가 포함되면 비밀번호 변경이 거부된다")
    @Test
    void changeMyPassword_rejectsNewPasswordContainingLoginCode() throws Exception {
        PlatformUserDAO platformUserDAO = mock(PlatformUserDAO.class);
        PlatformUserServiceImpl service = new PlatformUserServiceImpl();
        ReflectionTestUtils.setField(service, "platformUserDAO", platformUserDAO);

        PlatformUserPasswordChangeRequestVO payload = new PlatformUserPasswordChangeRequestVO();
        payload.setCurrentPassword("oldPassword1");
        payload.setNewPassword("HONG123newpass");
        payload.setConfirmPassword("HONG123newpass");

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.changeMyPassword("TENANT1", "hong123", payload));

        assertEquals("비밀번호에 아이디를 포함할 수 없습니다.", ex.getMessage());
        verifyNoInteractions(platformUserDAO);
    }
}