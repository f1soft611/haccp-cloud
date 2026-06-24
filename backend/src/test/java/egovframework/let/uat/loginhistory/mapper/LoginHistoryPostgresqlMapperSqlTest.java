package egovframework.let.uat.loginhistory.mapper;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class LoginHistoryPostgresqlMapperSqlTest {

    @DisplayName("PostgreSQL 로그인 이력 insert SQL은 현행 스키마 필수 컬럼을 포함해야 한다")
    @Test
    void insertSqlShouldMatchCurrentPostgresqlSchema() throws IOException {
        String mapperXml = readMapperXml();

        assertThat(mapperXml.toLowerCase())
                .contains("insert into tb_login_history")
                .contains("tenant_id")
                .contains("login_code")
            .contains("role_code")
            .contains("user_code");
    }

    private String readMapperXml() throws IOException {
        String path = "egovframework/mapper/let/uat/loginhistory/LoginHistoryMapper_SQL_postgresql.xml";
        try (InputStream inputStream = getClass().getClassLoader().getResourceAsStream(path)) {
            assertThat(inputStream)
                    .as("mapper xml should exist on classpath: %s", path)
                    .isNotNull();
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] chunk = new byte[4096];
            int read;
            while ((read = inputStream.read(chunk)) != -1) {
                buffer.write(chunk, 0, read);
            }
            return new String(buffer.toByteArray(), StandardCharsets.UTF_8);
        }
    }
}
