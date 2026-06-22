package egovframework.let.platforms.menus.service.impl;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

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
}
