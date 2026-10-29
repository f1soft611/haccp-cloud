package egovframework.let.platform_admin.migration.service;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * DB 하나의 tb_schema_migration 접근. 호출자가 Connection 과 트랜잭션을 관리한다.
 */
public final class SchemaMigrationHistory {

    public static final String CREATE_TABLE_SQL =
            "CREATE TABLE IF NOT EXISTS public.tb_schema_migration ("
                    + " migration_id VARCHAR(200) PRIMARY KEY,"
                    + " success_at CHAR(1) NOT NULL,"
                    + " error_message TEXT,"
                    + " applied_by VARCHAR(100),"
                    + " applied_at TIMESTAMP NOT NULL DEFAULT NOW())";

    private static final String UPSERT_SQL =
            "INSERT INTO public.tb_schema_migration (migration_id, success_at, error_message, applied_by, applied_at)"
                    + " VALUES (?, ?, ?, ?, NOW())"
                    + " ON CONFLICT (migration_id) DO UPDATE SET success_at = EXCLUDED.success_at,"
                    + " error_message = EXCLUDED.error_message, applied_by = EXCLUDED.applied_by, applied_at = NOW()";

    private SchemaMigrationHistory() {
    }

    public static void ensureTable(Connection connection) throws Exception {
        try (Statement statement = connection.createStatement()) {
            statement.execute(CREATE_TABLE_SQL);
        }
    }

    /** 파일명 -> 이력 행. */
    public static Map<String, Map<String, Object>> load(Connection connection) throws Exception {
        Map<String, Map<String, Object>> rows = new LinkedHashMap<String, Map<String, Object>>();
        try (Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(
                     "SELECT migration_id, success_at, error_message, applied_by,"
                             + " to_char(applied_at, 'YYYY-MM-DD HH24:MI:SS') AS applied_at"
                             + " FROM public.tb_schema_migration")) {
            while (resultSet.next()) {
                Map<String, Object> row = new LinkedHashMap<String, Object>();
                row.put("successAt", resultSet.getString("success_at"));
                row.put("errorMessage", resultSet.getString("error_message"));
                row.put("appliedBy", resultSet.getString("applied_by"));
                row.put("appliedAt", resultSet.getString("applied_at"));
                rows.put(resultSet.getString("migration_id"), row);
            }
        }
        return rows;
    }

    public static Map<String, String> successById(Map<String, Map<String, Object>> rows) {
        Map<String, String> result = new LinkedHashMap<String, String>();
        for (Map.Entry<String, Map<String, Object>> entry : rows.entrySet()) {
            result.put(entry.getKey(), (String) entry.getValue().get("successAt"));
        }
        return result;
    }

    public static void record(Connection connection, String migrationId, boolean success,
                              String errorMessage, String appliedBy) throws Exception {
        try (PreparedStatement statement = connection.prepareStatement(UPSERT_SQL)) {
            statement.setString(1, migrationId);
            statement.setString(2, success ? "Y" : "N");
            statement.setString(3, errorMessage);
            statement.setString(4, appliedBy);
            statement.executeUpdate();
        }
    }

    /** 새 테넌트: SQL 실행 없이 현재 파일 전부를 성공으로 기록한다. */
    public static void baseline(Connection connection, List<String> migrationIds) throws Exception {
        ensureTable(connection);
        for (String migrationId : migrationIds) {
            record(connection, migrationId, true, null, "BASELINE");
        }
    }
}