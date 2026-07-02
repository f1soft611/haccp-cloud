package egovframework.let.platform_admin.tenants.service.impl;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TenantCodeGeneratorTest {

    @DisplayName("해당 일자의 최대 코드가 없으면 yyMMdd0001을 생성한다")
    @Test
    void nextTenantCodeFromEmpty() {
        assertEquals("2606220001", TenantCodeGenerator.nextTenantCode("260622", null));
    }

    @DisplayName("해당 일자의 최대 코드에서 1 증가한 시퀀스를 생성한다")
    @Test
    void nextTenantCodeFromExisting() {
        assertEquals("2606220008", TenantCodeGenerator.nextTenantCode("260622", "2606220007"));
    }

    @DisplayName("하루 시퀀스 9999 다음 코드는 생성할 수 없다")
    @Test
    void nextTenantCodeOverflow() {
        assertThrows(IllegalStateException.class, () -> TenantCodeGenerator.nextTenantCode("260622", "2606229999"));
    }
}
