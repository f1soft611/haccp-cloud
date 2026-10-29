package egovframework.let.platform_admin.migration.service;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.TreeSet;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import egovframework.let.platform_admin.tenants.service.impl.TenantSchemaScript;

/**
 * classpath:sql/migrations/*.sql 목록과 본문. 파일명 오름차순이 실행 순서다.
 */
public final class SchemaMigrationFiles {

    private static final String LOCATION = "sql/migrations/";

    private SchemaMigrationFiles() {
    }

    public static List<String> listIds() throws Exception {
        Resource[] resources = new PathMatchingResourcePatternResolver()
                .getResources("classpath*:" + LOCATION + "*.sql");
        TreeSet<String> ids = new TreeSet<String>();
        for (Resource resource : resources) {
            if (resource.getFilename() != null) {
                ids.add(resource.getFilename());
            }
        }
        return new ArrayList<String>(ids);
    }

    /** 목록에 실제 있는 파일명만 허용한다 (경로 조작 차단). */
    public static String read(String migrationId) throws Exception {
        if (!listIds().contains(migrationId)) {
            throw new IllegalArgumentException("알 수 없는 마이그레이션입니다: " + migrationId);
        }
        try (InputStream inputStream = new ClassPathResource(LOCATION + migrationId).getInputStream()) {
            return new String(readAllBytes(inputStream), StandardCharsets.UTF_8);
        }
    }

    public static List<String> statements(String migrationId) throws Exception {
        return TenantSchemaScript.splitStatements(read(migrationId));
    }

    private static byte[] readAllBytes(InputStream inputStream) throws java.io.IOException {
        java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int readCount;
        while ((readCount = inputStream.read(buffer)) != -1) {
            outputStream.write(buffer, 0, readCount);
        }
        return outputStream.toByteArray();
    }
}