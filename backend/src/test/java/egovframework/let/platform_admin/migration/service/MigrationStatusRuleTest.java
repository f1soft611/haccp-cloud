package egovframework.let.platform_admin.migration.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class MigrationStatusRuleTest {

    private final List<String> ids = Arrays.asList("20261101_01_a.sql", "20261101_02_b.sql", "20261102_01_c.sql");

    @DisplayName("이력 성공, 실패, 없음, 선행 미적용을 구분한다")
    @Test
    void status_coversAllCases() {
        Map<String, String> history = new HashMap<String, String>();
        history.put("20261101_01_a.sql", "Y");
        history.put("20261101_02_b.sql", "N");

        assertEquals(MigrationStatusRule.APPLIED, MigrationStatusRule.status(ids, history, "20261101_01_a.sql"));
        assertEquals(MigrationStatusRule.FAILED, MigrationStatusRule.status(ids, history, "20261101_02_b.sql"));
        assertEquals(MigrationStatusRule.BLOCKED, MigrationStatusRule.status(ids, history, "20261102_01_c.sql"));
    }

    @DisplayName("선행 파일이 모두 성공이면 미적용 파일은 PENDING 이다")
    @Test
    void status_pendingWhenPreviousApplied() {
        Map<String, String> history = new HashMap<String, String>();
        history.put("20261101_01_a.sql", "Y");

        assertEquals(MigrationStatusRule.PENDING, MigrationStatusRule.status(ids, history, "20261101_02_b.sql"));
        assertEquals(MigrationStatusRule.PENDING, MigrationStatusRule.status(ids, new HashMap<String, String>(), "20261101_01_a.sql"));
    }

    @DisplayName("이미 성공한 파일은 선행 파일 상태와 관계없이 APPLIED 이다")
    @Test
    void status_appliedWinsOverBlocked() {
        Map<String, String> history = new HashMap<String, String>();
        history.put("20261102_01_c.sql", "Y");

        assertEquals(MigrationStatusRule.APPLIED, MigrationStatusRule.status(ids, history, "20261102_01_c.sql"));
    }
}