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
}
