package egovframework.let.platform_admin.tenants.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.Statement;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class TenantSchemaScriptTest {

    @DisplayName("세미콜론 기준으로 실행 가능한 구문만 분리한다")
    @Test
    void splitStatements_splitsOnStatementBoundaries() {
        String script = "CREATE TABLE a (id BIGINT);\n"
                + "-- comment; not a boundary\n"
                + "INSERT INTO a VALUES (1);\n";

        List<String> statements = TenantSchemaScript.splitStatements(script);

        assertEquals(2, statements.size());
        assertEquals("CREATE TABLE a (id BIGINT)", statements.get(0));
        assertEquals("INSERT INTO a VALUES (1)", statements.get(1));
    }

    @DisplayName("문자열 리터럴 안의 세미콜론은 구문 경계로 보지 않는다")
    @Test
    void splitStatements_keepsSemicolonInsideLiteral() {
        String script = "INSERT INTO a VALUES ('x;y');";

        List<String> statements = TenantSchemaScript.splitStatements(script);

        assertEquals(1, statements.size());
        assertEquals("INSERT INTO a VALUES ('x;y')", statements.get(0));
    }

    @DisplayName("트랜잭션 제어 구문은 JDBC 실행 대상에서 제외한다")
    @Test
    void splitStatements_dropsTransactionControlStatements() {
        String script = "BEGIN;\nCREATE TABLE a (id BIGINT);\nCOMMIT;";

        List<String> statements = TenantSchemaScript.splitStatements(script);

        assertEquals(Arrays.asList("CREATE TABLE a (id BIGINT)"), statements);
    }

    @DisplayName("DO $$ ... $$ 익명 블록 안의 세미콜론은 문장 경계로 보지 않는다")
    @Test
    void splitStatements_keepsDollarQuotedBlockTogether() {
        String script = "DO $$\n"
                + "BEGIN\n"
                + "    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tb_department') THEN\n"
                + "        ALTER TABLE tb_department ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;\n"
                + "    END IF;\n"
                + "END $$;\n"
                + "CREATE TABLE a (id BIGINT);";

        List<String> statements = TenantSchemaScript.splitStatements(script);

        assertEquals(2, statements.size());
        assertTrue(statements.get(0).startsWith("DO $$"));
        assertEquals("CREATE TABLE a (id BIGINT)", statements.get(1));
    }

    @DisplayName("DO $$ ... $$ 블록이 중첩된 SQL도 한 번에 처리한다")
    @Test
    void splitStatements_keepsMultiStatementDollarQuotedBlockTogether() {
        String script = "BEGIN;\n"
                + "CREATE TABLE a (id INT);\n"
                + "DO $$\n"
                + "BEGIN\n"
                + "    IF EXISTS (SELECT 1 FROM a) THEN\n"
                + "        UPDATE a SET id = 1;\n"
                + "    END IF;\n"
                + "END $$;\n"
                + "ALTER TABLE a ADD COLUMN name VARCHAR(20);\n"
                + "COMMIT;";

        List<String> statements = TenantSchemaScript.splitStatements(script);

        assertEquals(3, statements.size());
        assertEquals("CREATE TABLE a (id INT)", statements.get(0));
        assertTrue(statements.get(1).startsWith("DO $$"));
        assertEquals("ALTER TABLE a ADD COLUMN name VARCHAR(20)", statements.get(2));
    }

    @DisplayName("psql 변수를 안전한 리터럴로 치환한다")
    @Test
    void bindVariables_replacesPsqlVariables() {
        Map<String, String> variables = new HashMap<String, String>();
        variables.put("tenant_id", "5");
        variables.put("tenant_code", "TENANT_2608200001");
        variables.put("plan_code", "P");
        variables.put("menu_codes", "MENU_A,MENU_B");

        String bound = TenantSchemaScript.bindVariables(
                "SELECT :'tenant_id'::bigint, :'tenant_code', :'plan_code', :'menu_codes'",
                variables);

        assertEquals(
                "SELECT '5'::bigint, 'TENANT_2608200001', 'P', 'MENU_A,MENU_B'",
                bound);
    }

    @DisplayName("허용되지 않은 문자가 포함된 변수 값은 거부한다")
    @Test
    void bindVariables_rejectsUnsafeValue() {
        Map<String, String> variables = new HashMap<String, String>();
        variables.put("tenant_code", "TENANT'); DROP TABLE tb_tenant; --");

        assertThrows(
                IllegalArgumentException.class,
                () -> TenantSchemaScript.bindVariables("SELECT :'tenant_code'", variables));
    }

    @DisplayName("빈 값 변수는 빈 문자열 리터럴로 치환한다")
    @Test
    void bindVariables_allowsEmptyValue() {
        Map<String, String> variables = new HashMap<String, String>();
        variables.put("menu_codes", "");

        assertEquals("SELECT ''", TenantSchemaScript.bindVariables("SELECT :'menu_codes'", variables));
    }

    @DisplayName("작업 디렉터리가 backend여도 DATABASE 스크립트를 찾는다")
    @Test
    void resolveScriptPath_findsScriptFromBackendWorkingDirectory() {
        String resolved = TenantSchemaScript.resolveScriptPath(
                "backend/DATABASE/bootstrap_postgresql_tenant.sql",
                System.getProperty("user.dir"));

        assertTrue(resolved.endsWith("bootstrap_postgresql_tenant.sql"), resolved);
        assertTrue(new java.io.File(resolved).isFile(), resolved);
    }

    @DisplayName("backend 폴더에서 실행해도 루트 기준의 DATABASE 경로를 찾는다")
    @Test
    void resolveScriptPath_findsScriptWhenWorkingDirectoryIsBackendRoot() {
        String backendDir = new java.io.File(".").getAbsolutePath();
        String resolved = TenantSchemaScript.resolveScriptPath(
                "backend/DATABASE/create_postgresql_schema_active_tables.sql",
                backendDir);

        assertTrue(resolved.endsWith("create_postgresql_schema_active_tables.sql"), resolved);
        assertTrue(new java.io.File(resolved).isFile(), resolved);
    }

    @DisplayName("테넌트 DB 스키마에는 중앙 관리용 토큰/도메인/DB 레지스트리 테이블이 포함되지 않는다")
    @Test
    void schema_excludesCentralTenantRegistryTables() throws Exception {
        String sql = new String(java.nio.file.Files.readAllBytes(
                java.nio.file.Paths.get("DATABASE", "create_postgresql_schema_active_tables.sql")),
                java.nio.charset.StandardCharsets.UTF_8);

        assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS tb_tenant"));
        assertTrue(!sql.contains("CREATE TABLE IF NOT EXISTS tb_tenant_auth_token"));
        assertTrue(!sql.contains("CREATE TABLE IF NOT EXISTS tb_tenant_domain"));
        assertTrue(!sql.contains("CREATE TABLE IF NOT EXISTS tb_tenant_database"));
        assertTrue(!sql.contains("CREATE TABLE IF NOT EXISTS tb_tenant_subscription"));
        assertTrue(!sql.contains("CREATE TABLE IF NOT EXISTS tb_plan"));
        assertTrue(!sql.contains("CREATE TABLE IF NOT EXISTS tb_plan_menu"));
    }

    @DisplayName("테넌트 DB 스키마는 중앙 도메인 테이블을 참조하거나 인덱스를 생성하지 않는다")
    @Test
    void schema_doesNotReferenceCentralTenantDomainTable() throws Exception {
        String sql = new String(java.nio.file.Files.readAllBytes(
                java.nio.file.Paths.get("DATABASE", "create_postgresql_schema_active_tables.sql")),
                java.nio.charset.StandardCharsets.UTF_8);

        assertTrue(!sql.contains("tb_tenant_domain"));
    }

    @DisplayName("테넌트 부트스트랩은 하드코딩된 메뉴 목록 대신 중앙 플랜의 menu_codes를 바인딩한다")
    @Test
    void bootstrapTenantScript_usesCentralPlanMenuCodesInsteadOfHardcodedCatalog() throws Exception {
        String sql = new String(
                Files.readAllBytes(Paths.get("DATABASE", "bootstrap_postgresql_tenant.sql")),
                StandardCharsets.UTF_8);

        assertTrue(sql.contains("regexp_split_to_table(:'menu_codes', ',')"));
        assertTrue(!sql.contains("CREATE TABLE IF NOT EXISTS tb_plan"));
        assertTrue(!sql.contains("INSERT INTO tb_tenant_subscription"));
        assertTrue(!sql.contains("INSERT INTO tb_plan_menu"));
        assertTrue(!sql.contains("'MENU_TENANT_DASHBOARD'"));
    }

    @DisplayName("테넌트 부트스트랩은 중앙 tb_menu의 실제 메타데이터와 상위메뉴 관계를 그대로 복사한다")
    @Test
    void bootstrapTenantScript_copiesActualMenuMetadataAndHierarchy() throws Exception {
        String sql = new String(
                Files.readAllBytes(Paths.get("DATABASE", "bootstrap_postgresql_tenant.sql")),
                StandardCharsets.UTF_8);

        assertTrue(sql.contains("FROM public.tb_menu sm"));
        assertTrue(sql.contains("JOIN requested_codes rc ON rc.menu_code = sm.menu_code"));
        assertTrue(sql.contains("sm.menu_id"));
        assertTrue(sql.contains("sm.parent_menu_id"));
        assertTrue(sql.contains("sm.menu_nm"));
        assertTrue(sql.contains("sm.menu_dc"));
        assertTrue(sql.contains("sm.menu_url"));
    }

    @DisplayName("필수 스크립트가 아니면 SQL 실패를 조용히 건너뛴다")
    @Test
    void runScriptSafely_returnsFalseWhenOptionalScriptFails() {
        TenantDatabaseProvisioningServiceImpl service = new TenantDatabaseProvisioningServiceImpl();

        boolean result = service.runScriptSafely(
                "jdbc:postgresql://localhost:5432/tenant_test",
                "backend/DATABASE/does_not_exist.sql",
                new java.util.HashMap<String, String>());

        assertTrue(!result);
    }

    @DisplayName("PostgreSQL 연결은 UTF-8 인코딩을 강제한다")
    @Test
    void configureConnectionForUtf8_setsClientEncoding() throws Exception {
        Connection connection = mock(Connection.class);
        Statement statement = mock(Statement.class);
        when(connection.createStatement()).thenReturn(statement);

        TenantDatabaseProvisioningServiceImpl service = new TenantDatabaseProvisioningServiceImpl();
        java.lang.reflect.Method method = TenantDatabaseProvisioningServiceImpl.class
                .getDeclaredMethod("configureConnectionForUtf8", Connection.class);
        method.setAccessible(true);

        method.invoke(service, connection);

        verify(statement).execute("SET client_encoding TO 'UTF8'");
    }

}
