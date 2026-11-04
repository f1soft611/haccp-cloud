package egovframework.let.platform_admin.migration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Scanner;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import egovframework.let.platform_admin.tenants.service.impl.TenantSchemaScript;

class ExpirationTargetLatestViewSqlTest {

    // 줄바꿈(CRLF/LF)에 영향받지 않도록 한 줄 단위 문자열만 비교한다
    private static final String VIEW_KEY = "s.equipment_id, COALESCE(s.material_type, ''), s.certification_user_id)";

    private String read(String path) throws Exception {
        ClassPathResource resource = new ClassPathResource(path);
        assertTrue(resource.exists(), path + " 파일이 없다");
        try (InputStream inputStream = resource.getInputStream();
             Scanner scanner = new Scanner(inputStream, StandardCharsets.UTF_8.name())) {
            return scanner.useDelimiter("\\A").hasNext() ? scanner.next() : "";
        }
    }

    @Test
    void migration_should_create_view_only_where_approval_tables_exist() throws Exception {
        String sql = read("sql/migrations/20261104_01_create_v_expiration_target_latest.sql");
        assertTrue(sql.contains("to_regclass('public.tb_electronic_approval_main') IS NULL"),
                "central 에는 전자결재 테이블이 없으므로 건너뛰어야 한다");
        assertTrue(sql.contains("CREATE OR REPLACE VIEW public.v_expiration_target_latest"), "뷰 생성문이 없다");
        assertTrue(sql.contains(VIEW_KEY), "대상 키가 스펙과 다르다");
        assertEquals(1, TenantSchemaScript.splitStatements(sql).size(),
                "DO 블록 하나로 실행되어야 한다 (문장 분리기가 블록을 쪼개면 안 됨)");
    }

    @Test
    void tenantProvisioningScript_should_create_view() throws Exception {
        String sql = read("sql/postgresql/migrate_postgresql_add_electronic_approval_tables.sql");
        assertTrue(sql.contains("CREATE OR REPLACE VIEW v_expiration_target_latest"),
                "신규 테넌트 생성 시에도 뷰가 만들어져야 한다");
        assertTrue(sql.contains(VIEW_KEY), "대상 키가 마이그레이션과 같아야 한다");
    }
}