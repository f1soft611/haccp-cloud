package egovframework.let.documents.portal.domain.repository;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Scanner;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

class HaccpPortalDocumentMapperPostgresqlTest {

    @Test
    void portalMapper_should_build_assignee_summary_from_authority_table() throws Exception {
        ClassPathResource resource = new ClassPathResource(
                "egovframework/mapper/let/documents/portal/HaccpPortalDocumentMapper_SQL_postgresql.xml");
        assertTrue(resource.exists(), "Expected PostgreSQL portal mapper to exist");

        try (InputStream inputStream = resource.getInputStream();
             Scanner scanner = new Scanner(inputStream, StandardCharsets.UTF_8.name())) {
            String xml = scanner.useDelimiter("\\A").hasNext() ? scanner.next() : "";
            assertFalse(xml.contains("'관리자 외 2명' AS"), "assignee_summary must not be hardcoded");
            assertTrue(xml.contains(") wa ON TRUE"), "assignee LATERAL join is missing");
            assertTrue(xml.contains("first_assignee_name"), "first_assignee_name is missing");
            assertTrue(xml.contains("assignee_count"), "assignee_count is missing");
        }
    }
}
