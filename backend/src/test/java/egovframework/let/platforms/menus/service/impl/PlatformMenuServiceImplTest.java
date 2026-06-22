package egovframework.let.platforms.menus.service.impl;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import egovframework.let.platforms.menus.domain.repository.PlatformMenuDAO;
import egovframework.let.uss.auth.service.MenuInfoVO;

class PlatformMenuServiceImplTest {

    @Test
    void createMenu_generatesMenuCodeWhenMissing() throws Exception {
        PlatformMenuDAO platformMenuDAO = mock(PlatformMenuDAO.class);
        PlatformMenuServiceImpl service = new PlatformMenuServiceImpl();
        ReflectionTestUtils.setField(service, "platformMenuDAO", platformMenuDAO);

        when(platformMenuDAO.selectMenuDetail(any(MenuInfoVO.class))).thenAnswer(invocation -> {
            MenuInfoVO condition = invocation.getArgument(0);
            if (condition.getMenuCode() == null || condition.getMenuCode().trim().isEmpty()) {
                return null;
            }
            MenuInfoVO created = new MenuInfoVO();
            created.setMenuCode(condition.getMenuCode());
            created.setMenuNm("신규 메뉴");
            return created;
        });

        MenuInfoVO request = new MenuInfoVO();
        request.setMenuNm("신규 메뉴");
        request.setMenuUrl("/platform/new-menu");
        request.setUseAt("Y");
        request.setFrstRegisterId("system");
        request.setLastUpdusrId("system");

        MenuInfoVO result = assertDoesNotThrow(() -> service.createMenu(request));

        assertNotNull(result);
        assertNotNull(request.getMenuCode());
        assertFalse(request.getMenuCode().trim().isEmpty());
    }

    @Test
    void deleteMenu_deletesRoleMenuMappingsBeforeMenuDelete() throws Exception {
        PlatformMenuDAO platformMenuDAO = mock(PlatformMenuDAO.class);
        PlatformMenuServiceImpl service = new PlatformMenuServiceImpl();
        ReflectionTestUtils.setField(service, "platformMenuDAO", platformMenuDAO);

        when(platformMenuDAO.selectMenuDetail(any(MenuInfoVO.class))).thenAnswer(invocation -> {
            MenuInfoVO condition = invocation.getArgument(0);
            if (condition.getMenuId() == null || condition.getMenuId() != 101L) {
                return null;
            }
            MenuInfoVO menu = new MenuInfoVO();
            menu.setMenuId(101L);
            menu.setMenuNm("테스트 메뉴");
            return menu;
        });

        when(platformMenuDAO.selectMenuList(any(MenuInfoVO.class))).thenReturn(java.util.Collections.emptyList());

        assertDoesNotThrow(() -> service.deleteMenu(101L));

        org.mockito.InOrder inOrder = inOrder(platformMenuDAO);
        inOrder.verify(platformMenuDAO).deleteRoleMenuPermissionsByMenuId(101L);
        inOrder.verify(platformMenuDAO).deleteMenu(any(MenuInfoVO.class));
        verify(platformMenuDAO).deleteRoleMenuPermissionsByMenuId(101L);
    }

    @Test
    void deleteMenu_returnsFriendlyMessageWhenFkConstraintFails() throws Exception {
        PlatformMenuDAO platformMenuDAO = mock(PlatformMenuDAO.class);
        PlatformMenuServiceImpl service = new PlatformMenuServiceImpl();
        ReflectionTestUtils.setField(service, "platformMenuDAO", platformMenuDAO);

        when(platformMenuDAO.selectMenuDetail(any(MenuInfoVO.class))).thenAnswer(invocation -> {
            MenuInfoVO condition = invocation.getArgument(0);
            if (condition.getMenuId() == null || condition.getMenuId() != 202L) {
                return null;
            }
            MenuInfoVO menu = new MenuInfoVO();
            menu.setMenuId(202L);
            menu.setMenuNm("삭제 테스트 메뉴");
            return menu;
        });

        when(platformMenuDAO.selectMenuList(any(MenuInfoVO.class))).thenReturn(java.util.Collections.emptyList());
        doThrow(new DataIntegrityViolationException("fk violation"))
                .when(platformMenuDAO).deleteMenu(any(MenuInfoVO.class));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.deleteMenu(202L)
        );

        assertTrue(exception.getReason().contains("참조하는 데이터"));
    }
}
