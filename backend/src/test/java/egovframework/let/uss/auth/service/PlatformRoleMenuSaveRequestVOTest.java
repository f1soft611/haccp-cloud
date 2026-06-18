package egovframework.let.uss.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Arrays;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PlatformRoleMenuSaveRequestVOTest {

    @DisplayName("roleCode와 menuIds를 대문자 및 중복 제거로 정규화한다")
    @Test
    void normalizeMenuIdsUppercaseAndDistinct() {
        PlatformRoleMenuSaveRequestVO req = new PlatformRoleMenuSaveRequestVO();
        req.setRoleCode("tenant_admin");
        req.setMenuIds(Arrays.asList("menu_a", "menu_a", "menu_b"));

        req.normalize();

        assertEquals("TENANT_ADMIN", req.getRoleCode());
        assertEquals(Arrays.asList("MENU_A", "MENU_B"), req.getMenuIds());
    }
}