package egovframework.let.platform_admin.tenants.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
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

    @DisplayName("InputStream.available()가 0이어도 전체 내용을 안전하게 읽는다")
    @Test
    void readAllBytes_readsFullContentWhenAvailableReturnsZero() throws IOException {
        InputStream inputStream = new InputStream() {
            private final byte[] bytes = "SELECT 1;\nINSERT INTO tb_menu VALUES (1);".getBytes(StandardCharsets.UTF_8);
            private int index = 0;

            @Override
            public int read() {
                if (index >= bytes.length) {
                    return -1;
                }
                return bytes[index++];
            }

            @Override
            public int available() {
                return 0;
            }
        };

        byte[] actual = TenantSchemaScript.readAllBytes(inputStream);

        assertEquals("SELECT 1;\nINSERT INTO tb_menu VALUES (1);", new String(actual, StandardCharsets.UTF_8));
    }

    @DisplayName("메뉴 메타데이터 catalog는 |와 ;, 한글을 포함해도 안전하게 바인딩한다")
    @Test
    void bindVariables_allowsMenuCatalogWithKoreanAndDelimiters() {
        Map<String, String> variables = new HashMap<String, String>();
        variables.put("menu_catalog", "MENU_TENANT_DASHBOARD|대시보드|대시보드 요약|/tenant/dashboard|Dashboard|1|;MENU_TENANT_USERS|사용자|사용자 관리|/tenant/users|Users|2|");

        assertEquals(
                "SELECT 'MENU_TENANT_DASHBOARD|대시보드|대시보드 요약|/tenant/dashboard|Dashboard|1|;MENU_TENANT_USERS|사용자|사용자 관리|/tenant/users|Users|2|'",
                TenantSchemaScript.bindVariables("SELECT :'menu_catalog'", variables));
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

    @DisplayName("프로비저닝이 실제로 읽는 classpath 스키마에 공통코드 테이블과 role_dc가 있다")
    @Test
    void classpathSchema_containsCommonCodeTablesAndRoleDc() throws Exception {
        String sql = TenantSchemaScript.readScript(
                "sql/postgresql/create_postgresql_schema_active_tables.sql",
                System.getProperty("user.dir"));

        assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS tb_common_code_group"));
        assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS tb_common_code_item"));
        assertTrue(sql.contains("role_dc VARCHAR(500)"));
    }

    @DisplayName("classpath 테넌트 SQL 사본은 DATABASE 원본과 같아야 한다")
    @Test
    void classpathTenantScripts_matchDatabaseOriginals() throws Exception {
        for (String name : Arrays.asList(
                "create_postgresql_schema_active_tables.sql",
                "bootstrap_postgresql_tenant.sql",
                "migrate_postgresql_add_drafting_work_category_tables.sql",
                "migrate_postgresql_add_electronic_approval_tables.sql")) {
            String original = new String(
                    Files.readAllBytes(Paths.get("DATABASE", name)),
                    StandardCharsets.UTF_8).replace("\r\n", "\n");
            String copy = new String(
                    Files.readAllBytes(Paths.get("src", "main", "resources", "sql", "postgresql", name)),
                    StandardCharsets.UTF_8).replace("\r\n", "\n");

            assertEquals(original, copy,
                    name + ": src/main/resources/sql/postgresql 사본이 DATABASE 원본과 다릅니다. 원본을 복사하세요");
        }
    }

    @DisplayName("테넌트 스키마는 기초정보·작업지시 테이블을 FK 참조 순서대로 만든다")
    @Test
    void schema_createsBasicInfoAndWorkOrderTablesInFkOrder() throws Exception {
        String sql = new String(
                Files.readAllBytes(Paths.get("DATABASE", "create_postgresql_schema_active_tables.sql")),
                StandardCharsets.UTF_8);

        int tenant = sql.indexOf("CREATE TABLE IF NOT EXISTS tb_tenant (");
        int material = sql.indexOf("CREATE TABLE IF NOT EXISTS tb_material_info (");
        int customer = sql.indexOf("CREATE TABLE IF NOT EXISTS tb_customer_info (");
        int equipment = sql.indexOf("CREATE TABLE IF NOT EXISTS tb_equipment_info (");
        int workdirect = sql.indexOf("CREATE TABLE IF NOT EXISTS tb_workdirect (");

        assertTrue(material > tenant && customer > tenant && equipment > tenant, "기초정보 테이블은 tb_tenant 다음에 있어야 합니다");
        assertTrue(workdirect > material && workdirect > customer && workdirect > equipment, "tb_workdirect는 참조 테이블 다음에 있어야 합니다");
        // tb_workdirect의 (customer_id, tenant_id) FK가 참조할 UNIQUE 제약
        assertTrue(sql.contains("CONSTRAINT uq_customer_id_tenant_id UNIQUE (customer_id, tenant_id)"));
        assertTrue(sql.contains("CONSTRAINT uq_material_id_tenant_id UNIQUE (material_id, tenant_id)"));
        assertTrue(sql.contains("CONSTRAINT uq_equipment_id_tenant_id UNIQUE (equipment_id, tenant_id)"));
    }

    @DisplayName("테넌트 스키마의 설비 테이블에 검교정구분, 검교정주기 컬럼과 주기 CHECK 제약이 있다")
    @Test
    void schema_equipmentHasVcColumns() throws Exception {
        String sql = new String(
                Files.readAllBytes(Paths.get("DATABASE", "create_postgresql_schema_active_tables.sql")),
                StandardCharsets.UTF_8);

        assertTrue(sql.contains("vc_kind              VARCHAR(50),"));
        assertTrue(sql.contains("vc_cycle             INT4,"));
        assertTrue(sql.contains("CONSTRAINT ck_tb_equipment_info_vc_cycle CHECK (vc_cycle IS NULL OR vc_cycle > 0)"));
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

    @DisplayName("테넌트 부트스트랩은 부모 메뉴 관계를 보존하고 충돌 시에도 parent_menu_id를 갱신한다")
    @Test
    void bootstrapTenantScript_preservesParentMenuHierarchyOnConflict() throws Exception {
        String sql = new String(
                Files.readAllBytes(Paths.get("DATABASE", "bootstrap_postgresql_tenant.sql")),
                StandardCharsets.UTF_8);

        assertTrue(sql.contains("parent_menu_id = EXCLUDED.parent_menu_id"));
        assertTrue(sql.contains("source_parent_map.local_parent_menu_id"));
        assertTrue(sql.contains("LEFT JOIN inserted_menu parent_inserted ON parent_inserted.menu_code = sm.parent_menu_code"));
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

    @DisplayName("전자결재 상태 컬럼은 긴 상태값을 저장할 수 있어야 한다")
    @Test
    void electronicApprovalLineInfo_schemaAllowsLongStatusValues() throws Exception {
        String sql = new String(
                Files.readAllBytes(Paths.get("DATABASE", "migrate_postgresql_add_electronic_approval_tables.sql")),
                StandardCharsets.UTF_8);

        assertTrue(sql.contains("app_status VARCHAR(30) NOT NULL"));
        assertTrue(sql.contains("approval_type VARCHAR(30) NOT NULL"));
        assertTrue(sql.contains("last_owner_status VARCHAR(30) NOT NULL"));
        assertTrue(sql.contains("referencer_view_status VARCHAR(30)"));
        assertTrue(sql.contains("conn_official_status VARCHAR(30)"));
    }

    @DisplayName("업무 분류 스크립트는 cata_code 를 WF_TYPE 코드 길이로 늘리고 WF_TYPE 분류를 등록한다")
    @Test
    void draftingCategoryScript_seedsWfTypeCategories() throws Exception {
        String sql = new String(
                Files.readAllBytes(Paths.get("DATABASE", "migrate_postgresql_add_drafting_work_category_tables.sql")),
                StandardCharsets.UTF_8);

        assertTrue(!sql.contains("cata_code VARCHAR(3)"));
        assertTrue(sql.contains("cata_code VARCHAR(50) NOT NULL,"));
        assertTrue(sql.contains("cata_code VARCHAR(50),"));
        assertTrue(sql.contains("INSERT INTO tb_drafting_work_category_group (tenant_id, cata_code, cata_name, view_seq, use_at)"));
        assertTrue(sql.contains("WHERE g.group_code = 'WF_TYPE'"));
        assertTrue(sql.contains("ON CONFLICT (tenant_id, cata_code) DO NOTHING"));
        assertTrue(sql.indexOf("ON CONFLICT (tenant_id, cata_code) DO NOTHING")
                > sql.indexOf("CREATE TABLE IF NOT EXISTS tb_drafting_work_category_group"));
    }

    @DisplayName("전자결재 스크립트는 만료일 양식 sub 테이블을 main 다음에 만든다")
    @Test
    void electronicApprovalScript_createsSubTable() throws Exception {
        String sql = new String(
                Files.readAllBytes(Paths.get("DATABASE", "migrate_postgresql_add_electronic_approval_tables.sql")),
                StandardCharsets.UTF_8);

        int subIndex = sql.indexOf("CREATE TABLE IF NOT EXISTS tb_electronic_approval_sub (");
        assertTrue(subIndex > sql.indexOf("CREATE TABLE IF NOT EXISTS tb_electronic_approval_main ("));
        assertTrue(sql.contains("drafting_work_category_id BIGINT NOT NULL,"));
        assertTrue(sql.contains("material_type VARCHAR(50),"));
        assertTrue(sql.contains("inspected_date VARCHAR(8) NOT NULL,"));
        assertTrue(sql.contains("expiration_date VARCHAR(8) NOT NULL,"));
        assertTrue(sql.contains("CONSTRAINT fk_electronic_approval_sub_category"));
        assertTrue(sql.contains("CONSTRAINT fk_electronic_approval_sub_main"));
        assertTrue(sql.contains("CONSTRAINT fk_electronic_approval_sub_tenant"));
    }

    @DisplayName("기존 DB migration 은 cata_code 확장, WF_TYPE 분류 등록, sub 생성, material_type 변환을 순서대로 한다")
    @Test
    void wfTypeCategoryAndApprovalSubMigration_coversExistingDatabases() throws Exception {
        String sql = new String(
                Files.readAllBytes(Paths.get("DATABASE", "migrate_postgresql_wf_type_category_and_approval_sub.sql")),
                StandardCharsets.UTF_8);

        int groupAlter = sql.indexOf("ALTER TABLE public.tb_drafting_work_category_group ALTER COLUMN cata_code TYPE VARCHAR(50)");
        int workAlter = sql.indexOf("ALTER TABLE public.tb_drafting_work_category ALTER COLUMN cata_code TYPE VARCHAR(50)");
        int seed = sql.indexOf("WHERE g.group_code = 'WF_TYPE'");
        int createSub = sql.indexOf("CREATE TABLE IF NOT EXISTS public.tb_electronic_approval_sub (");
        int convert = sql.indexOf("AND data_type = 'bigint'");
        int comment = sql.indexOf("COMMENT ON COLUMN public.tb_electronic_approval_sub.material_type");

        assertTrue(groupAlter >= 0);
        assertTrue(workAlter > groupAlter);
        assertTrue(seed > workAlter);
        assertTrue(createSub > seed);
        assertTrue(convert > createSub);
        assertTrue(comment > convert);
        assertTrue(sql.contains("RENAME COLUMN material_type_code TO material_type"));
        assertTrue(sql.contains("ON CONFLICT (tenant_id, cata_code) DO NOTHING"));
    }

    @DisplayName("조건부 ID 생성은 PostgreSQL용 Mapper를 제공한다")
    @Test
    void conditionalIdMapper_postgresqlUsesUpsertStatement() throws Exception {
        String sql = new String(
                Files.readAllBytes(Paths.get("src", "main", "resources", "egovframework", "mapper", "let", "common", "idgen", "ConditionalId_SQL_postgresql.xml")),
                StandardCharsets.UTF_8);

        assertTrue(sql.contains("<mapper namespace=\"ConditionalIdDAO\">"));
        assertTrue(sql.contains("ON CONFLICT"));
        assertTrue(sql.contains("INSERT INTO ids2"));
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
