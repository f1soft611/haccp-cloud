package egovframework.let.dashboard.domain.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Scanner;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

class DashboardMapperPostgresqlTest {

    @Test
    void dashboardMapper_should_build_owner_from_authority_table() throws Exception {
        ClassPathResource resource = new ClassPathResource(
                "egovframework/mapper/let/dashboard/DashboardMapper_SQL_postgresql.xml");
        assertTrue(resource.exists(), "Expected PostgreSQL dashboard mapper to exist");

        try (InputStream inputStream = resource.getInputStream();
             Scanner scanner = new Scanner(inputStream, StandardCharsets.UTF_8.name())) {
            String xml = scanner.useDelimiter("\\A").hasNext() ? scanner.next() : "";
            assertFalse(xml.contains("CONCAT('검토:'"), "owner must not be reviewer/approver names");
            assertEquals(2, xml.split("\\) wa ON TRUE", -1).length - 1,
                    "assignee LATERAL join must exist in both todo and approval alert queries");
            assertTrue(xml.contains("first_assignee_name"), "first_assignee_name is missing");
            assertTrue(xml.contains("assignee_count"), "assignee_count is missing");
        }
    }

    @Test
    void dashboardMapper_should_count_unwritten_from_service_start_date_and_treat_pre_apply_as_unwritten() throws Exception {
        ClassPathResource resource = new ClassPathResource(
                "egovframework/mapper/let/dashboard/DashboardMapper_SQL_postgresql.xml");

        try (InputStream inputStream = resource.getInputStream();
             Scanner scanner = new Scanner(inputStream, StandardCharsets.UTF_8.name())) {
            String xml = scanner.useDelimiter("\\A").hasNext() ? scanner.next() : "";
            assertTrue(xml.contains("COALESCE(t.service_start_date, DATE(t.created_at))"),
                    "미작성 주기 시작은 업무개시일 기준이어야 한다");
            assertFalse(xml.contains("GREATEST(t.created_at, w.created_at)"),
                    "업무 등록일 하한은 쓰지 않는다");
            assertTrue(xml.contains("AND COALESCE(em.status_type, '') != 'pre_apply'"),
                    "임시저장만 있는 주기는 미작성으로 센다");
        }
    }
}
