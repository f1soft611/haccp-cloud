package egovframework.let.organization.users.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verifyNoInteractions;

import egovframework.let.organization.users.domain.model.PlatformUserSaveRequestVO;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import egovframework.let.utl.sim.service.EgovFileScrty;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import egovframework.let.organization.users.domain.model.PlatformUserSearchConditionVO;
import egovframework.let.organization.users.domain.repository.PlatformUserDAO;

class PlatformUserServiceImplTest {

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

    private static String dateError(String joinDate, String retireDate) {
        return assertThrows(IllegalArgumentException.class,
                () -> PlatformUserServiceImpl.validateEmploymentDates(joinDate, retireDate)).getMessage();
    }

    @DisplayName("입사일/퇴사일이 비어 있거나 올바른 순서면 통과한다")
    @Test
    void validateEmploymentDates_acceptsEmptyAndOrderedDates() {
        assertDoesNotThrow(() -> PlatformUserServiceImpl.validateEmploymentDates(null, null));
        assertDoesNotThrow(() -> PlatformUserServiceImpl.validateEmploymentDates("", "  "));
        assertDoesNotThrow(() -> PlatformUserServiceImpl.validateEmploymentDates("2024-03-02", null));
        assertDoesNotThrow(() -> PlatformUserServiceImpl.validateEmploymentDates(null, "2026-10-20"));
        assertDoesNotThrow(() -> PlatformUserServiceImpl.validateEmploymentDates("2024-03-02", "2024-03-02"));
        assertDoesNotThrow(() -> PlatformUserServiceImpl.validateEmploymentDates("2024-03-02", "2026-10-20"));
    }

    @DisplayName("날짜 형식이 YYYY-MM-DD가 아니거나 존재하지 않는 날짜면 거부한다")
    @Test
    void validateEmploymentDates_rejectsInvalidFormat() {
        assertEquals("입사일/퇴사일 형식이 올바르지 않습니다.", dateError("abc", null));
        assertEquals("입사일/퇴사일 형식이 올바르지 않습니다.", dateError("2026-13-01", null));
        assertEquals("입사일/퇴사일 형식이 올바르지 않습니다.", dateError(null, "2026-02-30"));
        assertEquals("입사일/퇴사일 형식이 올바르지 않습니다.", dateError("2026/10/20", null));
        assertEquals("입사일/퇴사일 형식이 올바르지 않습니다.", dateError("2026-1-5", null));
    }

    @DisplayName("퇴사일이 입사일보다 이전이면 거부한다")
    @Test
    void validateEmploymentDates_rejectsRetireBeforeJoin() {
        assertEquals("퇴사일은 입사일 이후여야 합니다.", dateError("2026-10-20", "2026-10-19"));
    }

    @DisplayName("사용자 수정 시 날짜 순서가 잘못되면 DB 접근 전에 거부한다")
    @Test
    void updateUser_rejectsRetireBeforeJoinBeforeDaoAccess() {
        PlatformUserDAO platformUserDAO = mock(PlatformUserDAO.class);
        PlatformUserServiceImpl service = new PlatformUserServiceImpl();
        ReflectionTestUtils.setField(service, "platformUserDAO", platformUserDAO);

        PlatformUserSaveRequestVO payload = new PlatformUserSaveRequestVO();
        payload.setName("홍길동");
        payload.setEmail("hong@alpha.com");
        payload.setDepartment("품질관리팀");
        payload.setRoleCode("TENANT_USER");
        payload.setJoinDate("2026-10-20");
        payload.setRetireDate("2026-01-01");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.updateUser(1L, payload));
        assertEquals("퇴사일은 입사일 이후여야 합니다.", ex.getMessage());
        verifyNoInteractions(platformUserDAO);
    }

    @DisplayName("이메일 형식이 틀리면 DB 접근 전에 거부한다")
    @Test
    void updateUser_rejectsInvalidEmailBeforeDaoAccess() {
        PlatformUserDAO platformUserDAO = mock(PlatformUserDAO.class);
        PlatformUserServiceImpl service = new PlatformUserServiceImpl();
        ReflectionTestUtils.setField(service, "platformUserDAO", platformUserDAO);

        for (String email : new String[] {"hong", "hong@alpha", "hong@@alpha.com", "홍@alpha.com", "hong@alpha.c"}) {
            PlatformUserSaveRequestVO payload = new PlatformUserSaveRequestVO();
            payload.setName("홍길동");
            payload.setEmail(email);
            payload.setDepartment("품질관리팀");
            payload.setRoleCode("TENANT_USER");

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> service.updateUser(1L, payload));
            assertEquals("이메일 형식이 올바르지 않습니다.", ex.getMessage(), email);
        }
        verifyNoInteractions(platformUserDAO);
    }

    @DisplayName("비밀번호 초기화 시 loginCode 두 번 반복 값을 loginCode salt 로 해시해 저장하고 평문을 반환한다")
    @Test
    @SuppressWarnings("unchecked")
    void resetPassword_storesHashOfLoginCodeTwice() throws Exception {
        PlatformUserDAO platformUserDAO = mock(PlatformUserDAO.class);
        when(platformUserDAO.selectTenantIdByCode(anyString())).thenReturn(10L);
        Map<String, Object> account = new HashMap<String, Object>();
        account.put("loginId", 77L);
        account.put("loginCode", "hong");
        when(platformUserDAO.selectLoginAccountByUserId(any())).thenReturn(account);

        PlatformUserServiceImpl service = new PlatformUserServiceImpl();
        ReflectionTestUtils.setField(service, "platformUserDAO", platformUserDAO);

        String tempPassword = service.resetPassword("TENANT1", 5L);

        assertEquals("honghong", tempPassword);
        ArgumentCaptor<Map<String, Object>> captor = ArgumentCaptor.forClass(Map.class);
        verify(platformUserDAO).updateLoginPasswordHash(captor.capture());
        assertEquals(77L, captor.getValue().get("loginId"));
        assertEquals(EgovFileScrty.encryptPassword("honghong", "hong"), captor.getValue().get("passwordHash"));
    }

    @DisplayName("비밀번호 초기화 대상 계정이 없으면 IllegalStateException")
    @Test
    void resetPassword_throwsWhenAccountMissing() throws Exception {
        PlatformUserDAO platformUserDAO = mock(PlatformUserDAO.class);
        when(platformUserDAO.selectTenantIdByCode(anyString())).thenReturn(10L);
        when(platformUserDAO.selectLoginAccountByUserId(any())).thenReturn(null);

        PlatformUserServiceImpl service = new PlatformUserServiceImpl();
        ReflectionTestUtils.setField(service, "platformUserDAO", platformUserDAO);

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> service.resetPassword("TENANT1", 5L));
        assertEquals("연결된 로그인 계정을 찾을 수 없습니다.", ex.getMessage());
    }
}
