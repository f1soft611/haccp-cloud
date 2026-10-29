package egovframework.let.platform_admin.migration.service;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import egovframework.let.platform_admin.tenants.service.TenantDatabaseProvisioningService;

/**
 * central + 사용 중인 테넌트 DB 에 classpath 마이그레이션을 적용하고 상태를 조회한다.
 */
@Service("schemaMigrationService")
public class SchemaMigrationService {

    private static final Logger log = LoggerFactory.getLogger(SchemaMigrationService.class);
    private static final long ADVISORY_LOCK_KEY = 7_302_026_001L;
    private static final String ERROR = "ERROR";

    @Resource(name = "tenantDatabaseProvisioningService")
    private TenantDatabaseProvisioningService provisioningService;

    /** 파일별 상태 개수. */
    public List<Map<String, Object>> list() throws Exception {
        List<String> ids = SchemaMigrationFiles.listIds();
        Map<String, Map<String, String>> statusByDb = new LinkedHashMap<String, Map<String, String>>();
        for (String dbName : targetDatabases()) {
            statusByDb.put(dbName, statusesFor(dbName, ids));
        }

        List<Map<String, Object>> rows = new ArrayList<Map<String, Object>>();
        for (String id : ids) {
            int applied = 0;
            int failed = 0;
            int pending = 0;
            int blocked = 0;
            for (Map<String, String> statuses : statusByDb.values()) {
                String status = statuses.get(id);
                if (MigrationStatusRule.APPLIED.equals(status)) {
                    applied++;
                } else if (MigrationStatusRule.PENDING.equals(status)) {
                    pending++;
                } else if (MigrationStatusRule.BLOCKED.equals(status)) {
                    blocked++;
                } else {
                    failed++; // FAILED 또는 접속 ERROR
                }
            }
            Map<String, Object> row = new LinkedHashMap<String, Object>();
            row.put("migrationId", id);
            row.put("appliedCount", applied);
            row.put("failedCount", failed);
            row.put("pendingCount", pending);
            row.put("blockedCount", blocked);
            row.put("runnable", failed + pending > 0);
            rows.add(row);
        }
        return rows;
    }

    /** SQL 본문 + DB별 상태. */
    public Map<String, Object> detail(String migrationId) throws Exception {
        String sql = SchemaMigrationFiles.read(migrationId);
        List<String> ids = SchemaMigrationFiles.listIds();

        List<Map<String, Object>> databases = new ArrayList<Map<String, Object>>();
        for (String dbName : targetDatabases()) {
            Map<String, Object> row = new LinkedHashMap<String, Object>();
            row.put("dbName", dbName);
            try (Connection connection = provisioningService.openDatabaseConnection(dbName)) {
                SchemaMigrationHistory.ensureTable(connection);
                Map<String, Map<String, Object>> history = SchemaMigrationHistory.load(connection);
                row.put("status", MigrationStatusRule.status(ids, SchemaMigrationHistory.successById(history), migrationId));
                Map<String, Object> historyRow = history.get(migrationId);
                if (historyRow != null) {
                    row.put("appliedAt", historyRow.get("appliedAt"));
                    row.put("appliedBy", historyRow.get("appliedBy"));
                    row.put("errorMessage", historyRow.get("errorMessage"));
                }
            } catch (Exception ex) {
                row.put("status", ERROR);
                row.put("errorMessage", ex.getMessage());
            }
            databases.add(row);
        }

        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("migrationId", migrationId);
        result.put("sql", sql);
        result.put("databases", databases);
        return result;
    }

    /**
     * 미적용/실패 DB 에만 실행한다. 다른 실행이 진행 중이면 IllegalStateException.
     * ponytail: 동기 실행, 테넌트 수백 개 규모면 비동기 작업으로 전환
     */
    public List<Map<String, Object>> apply(String migrationId, String appliedBy) throws Exception {
        List<String> statements = SchemaMigrationFiles.statements(migrationId);
        List<String> ids = SchemaMigrationFiles.listIds();

        try (Connection lockConnection = provisioningService.openDatabaseConnection(
                provisioningService.centralDatabaseName())) {
            if (!tryLock(lockConnection)) {
                throw new IllegalStateException("다른 마이그레이션이 실행 중입니다.");
            }
            try {
                List<Map<String, Object>> results = new ArrayList<Map<String, Object>>();
                for (String dbName : targetDatabases()) {
                    results.add(applyTo(dbName, migrationId, ids, statements, appliedBy));
                }
                return results;
            } finally {
                unlock(lockConnection);
            }
        }
    }

    private Map<String, Object> applyTo(String dbName, String migrationId, List<String> ids,
                                        List<String> statements, String appliedBy) {
        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("dbName", dbName);
        try (Connection connection = provisioningService.openDatabaseConnection(dbName)) {
            SchemaMigrationHistory.ensureTable(connection);
            String status = MigrationStatusRule.status(
                    ids, SchemaMigrationHistory.successById(SchemaMigrationHistory.load(connection)), migrationId);
            if (MigrationStatusRule.APPLIED.equals(status)) {
                result.put("result", "SKIPPED");
                return result;
            }
            if (MigrationStatusRule.BLOCKED.equals(status)) {
                result.put("result", MigrationStatusRule.BLOCKED);
                return result;
            }

            connection.setAutoCommit(false);
            try (Statement statement = connection.createStatement()) {
                for (String sql : statements) {
                    statement.execute(sql);
                }
                SchemaMigrationHistory.record(connection, migrationId, true, null, appliedBy);
                connection.commit();
                result.put("result", "SUCCESS");
            } catch (Exception ex) {
                connection.rollback();
                SchemaMigrationHistory.record(connection, migrationId, false, ex.getMessage(), appliedBy);
                connection.commit();
                log.warn("마이그레이션 실패 db={}, migration={}", dbName, migrationId, ex);
                result.put("result", MigrationStatusRule.FAILED);
                result.put("errorMessage", ex.getMessage());
            }
        } catch (Exception ex) {
            log.warn("마이그레이션 대상 DB 접속 실패 db={}", dbName, ex);
            result.put("result", MigrationStatusRule.FAILED);
            result.put("errorMessage", ex.getMessage());
        }
        return result;
    }

    private Map<String, String> statusesFor(String dbName, List<String> ids) {
        Map<String, String> statuses = new LinkedHashMap<String, String>();
        try (Connection connection = provisioningService.openDatabaseConnection(dbName)) {
            SchemaMigrationHistory.ensureTable(connection);
            Map<String, String> successById = SchemaMigrationHistory.successById(SchemaMigrationHistory.load(connection));
            for (String id : ids) {
                statuses.put(id, MigrationStatusRule.status(ids, successById, id));
            }
        } catch (Exception ex) {
            log.warn("마이그레이션 상태 조회 실패 db={}", dbName, ex);
            for (String id : ids) {
                statuses.put(id, ERROR);
            }
        }
        return statuses;
    }

    /** central 먼저, 그 다음 tb_tenant_database.use_at = 'Y' 테넌트 DB (이름순). */
    private List<String> targetDatabases() throws Exception {
        String central = provisioningService.centralDatabaseName();
        List<String> databases = new ArrayList<String>();
        databases.add(central);
        try (Connection connection = provisioningService.openDatabaseConnection(central);
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(
                     "SELECT db_name FROM public.tb_tenant_database WHERE use_at = 'Y' ORDER BY db_name")) {
            while (resultSet.next()) {
                String dbName = resultSet.getString(1);
                if (dbName != null && !dbName.trim().isEmpty() && !dbName.trim().equals(central)) {
                    databases.add(dbName.trim());
                }
            }
        }
        return databases;
    }

    private boolean tryLock(Connection connection) throws Exception {
        try (Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery("SELECT pg_try_advisory_lock(" + ADVISORY_LOCK_KEY + ")")) {
            return resultSet.next() && resultSet.getBoolean(1);
        }
    }

    private void unlock(Connection connection) throws Exception {
        try (Statement statement = connection.createStatement()) {
            statement.execute("SELECT pg_advisory_unlock(" + ADVISORY_LOCK_KEY + ")");
        }
    }
}