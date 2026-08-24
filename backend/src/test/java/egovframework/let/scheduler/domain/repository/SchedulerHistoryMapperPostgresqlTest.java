package egovframework.let.scheduler.domain.repository;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Scanner;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

class SchedulerHistoryMapperPostgresqlTest {

    @Test
    void postgresMapper_should_define_scheduler_history_dao_statements() throws Exception {
        ClassPathResource resource = new ClassPathResource("egovframework/mapper/let/scheduler/SchedulerHistoryMapper_SQL_postgresql.xml");
        assertTrue(resource.exists(), "Expected PostgreSQL scheduler history mapper to exist");

        try (InputStream inputStream = resource.getInputStream();
             Scanner scanner = new Scanner(inputStream, StandardCharsets.UTF_8.name())) {
            String xml = scanner.useDelimiter("\\A").hasNext() ? scanner.next() : "";
            assertNotNull(xml);
            assertTrue(xml.contains("namespace=\"SchedulerHistoryDAO\""), "Mapper namespace is missing");
            assertTrue(xml.contains("insertSchedulerHistory"), "insertSchedulerHistory statement is missing");
            assertTrue(xml.contains("selectSchedulerHistoryList"), "selectSchedulerHistoryList statement is missing");
        }

        ClassPathResource ddlResource = new ClassPathResource("sql/postgresql/create_postgresql_schema_active_tables.sql");
        assertTrue(ddlResource.exists(), "Expected PostgreSQL schema DDL to exist");

        try (InputStream ddlInputStream = ddlResource.getInputStream();
             Scanner ddlScanner = new Scanner(ddlInputStream, StandardCharsets.UTF_8.name())) {
            String ddl = ddlScanner.useDelimiter("\\A").hasNext() ? ddlScanner.next() : "";
            assertTrue(ddl.contains("CREATE TABLE IF NOT EXISTS tb_scheduler_history"),
                    "tb_scheduler_history table DDL is missing from PostgreSQL schema script");
        }
    }
}
