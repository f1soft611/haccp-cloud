package egovframework.let.platforms.tenants.service.impl;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TenantCodeGeneratorTest {

    @DisplayName("최대 코드가 없으면 000001을 생성한다")
    @Test
    void nextTenantCodeFromEmpty() {
        assertEquals("000001", TenantCodeGenerator.nextTenantCode(null));
    }

    @DisplayName("최대 코드에서 1 증가한 6자리 코드를 생성한다")
    @Test
    void nextTenantCodeFromExisting() {
        assertEquals("000124", TenantCodeGenerator.nextTenantCode("000123"));
    }

    @DisplayName("999999 다음 코드는 생성할 수 없다")
    @Test
    void nextTenantCodeOverflow() {
        assertThrows(IllegalStateException.class, () -> TenantCodeGenerator.nextTenantCode("999999"));
    }
}
