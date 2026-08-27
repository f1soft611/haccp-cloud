package egovframework.let.organization.users.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;

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
}
