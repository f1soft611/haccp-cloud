package egovframework.let.platforms.tenants.service.impl;

import static org.junit.jupiter.api.Assertions.assertTrue;

import egovframework.let.platform_admin.tenants.service.impl.TenantNoGenerator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class TenantNoGeneratorTest {
    @DisplayName("업체번호는 항상 100000~999999 범위의 6자리 숫자다")
    @Test
    void generateReturnsSixDigitsWithoutLeadingZero() {
        for (int i = 0; i < 10_000; i++) {
            String tenantNo = TenantNoGenerator.generate();
            assertTrue(tenantNo.matches("^[1-9][0-9]{5}$"), "invalid tenantNo: " + tenantNo);
        }
    }
}
