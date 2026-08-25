package egovframework.let.platform_admin.tenants.service.impl;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import javax.annotation.Resource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import egovframework.let.platform_admin.tenants.domain.repository.TenantInfoDAO;
import egovframework.let.platform_admin.tenants.service.TenantDatabaseProvisioningService;

@Service("tenantDatabaseProvisioningService")
public class TenantDatabaseProvisioningServiceImpl implements TenantDatabaseProvisioningService {

    private static final Logger log = LoggerFactory.getLogger(TenantDatabaseProvisioningServiceImpl.class);
    private static final String MAINTENANCE_DATABASE = "postgres";

    @Resource(name = "tenantInfoDAO")
    private TenantInfoDAO tenantInfoDAO;

    @Value("${Globals.postgresql.UserName:postgres}")
    private String adminUser;

    @Value("${Globals.postgresql.Password:}")
    private String adminPassword;

    @Value("${Globals.postgresql.Url:jdbc:log4jdbc:postgresql://localhost:5432/haccp_cloud}")
    private String postgresUrl;

    @Value("${Globals.postgresql.TenantSchemaFile:sql/postgresql/create_postgresql_schema_active_tables.sql}")
    private String tenantSchemaFile;

    @Value("${Globals.postgresql.TenantBootstrapFile:sql/postgresql/bootstrap_postgresql_tenant.sql}")
    private String tenantBootstrapFile;

    @Value("${Globals.postgresql.TenantDraftingCategoryFile:sql/postgresql/migrate_postgresql_add_drafting_work_category_tables.sql}")
    private String tenantDraftingCategoryFile;

    @Value("${Globals.postgresql.TenantElectronicApprovalFile:sql/postgresql/migrate_postgresql_add_electronic_approval_tables.sql}")
    private String tenantElectronicApprovalFile;

    @Value("${Globals.postgresql.TenantElectronicApprovalLikeFile:sql/postgresql/migrate_postgresql_add_electronic_approval_comment_likes.sql}")
    private String tenantElectronicApprovalLikeFile;

    @Value("${Globals.postgresql.TenantAttachmentFile:sql/postgresql/migrate_postgresql_add_document_attachment_tables.sql}")
    private String tenantAttachmentFile;

    @Override
    public boolean databaseExists(String dbName) {
        if (dbName == null || dbName.trim().isEmpty()) {
            return false;
        }

        String normalizedDbName = normalizeIdentifier(dbName);
        try (Connection connection = openConnection(resolveJdbcUrl(MAINTENANCE_DATABASE));
                Statement statement = connection.createStatement();
                ResultSet resultSet = statement.executeQuery(
                        "SELECT 1 FROM pg_database WHERE datname = '" + normalizedDbName + "'")) {
            return resultSet.next();
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to check tenant database existence for dbName=" + normalizedDbName, ex);
        }
    }

    @Override
    public void provisionNewTenantDatabase(
            Long tenantId,
            String tenantCode,
            String dbName,
            String schemaName,
            String planCode,
            List<String> planMenuCodes) {
        if (tenantId == null || tenantId <= 0L) {
            throw new IllegalArgumentException("tenantId is required");
        }
        if (dbName == null || dbName.trim().isEmpty()) {
            throw new IllegalArgumentException("dbName is required");
        }

        String normalizedDbName = normalizeIdentifier(dbName);
        String normalizedSchemaName = schemaName == null || schemaName.trim().isEmpty()
                ? "public"
                : normalizeIdentifier(schemaName);

        try {
            createDatabaseIfMissing(normalizedDbName);

            String tenantJdbcUrl = resolveJdbcUrl(normalizedDbName);
            executeStatement(tenantJdbcUrl, "CREATE SCHEMA IF NOT EXISTS \"" + normalizedSchemaName + "\"");

            List<String> effectiveMenuCodes = planMenuCodes == null || planMenuCodes.isEmpty()
                    ? resolveFallbackMenuCodes(planCode)
                    : planMenuCodes;
            List<String> expandedMenuCodes = expandMenuCodesWithAncestors(effectiveMenuCodes);

            Map<String, String> bootstrapVariables = new HashMap<String, String>();
            bootstrapVariables.put("tenant_id", String.valueOf(tenantId));
            bootstrapVariables.put("tenant_code", tenantCode == null ? "" : tenantCode.trim());
            bootstrapVariables.put("plan_code",
                    planCode == null || planCode.trim().isEmpty() ? "" : planCode.trim().toUpperCase());
            bootstrapVariables.put("menu_codes", normalizeMenuCodes(expandedMenuCodes, Collections.emptyList()));
            bootstrapVariables.put("menu_catalog", resolveMenuCatalog(expandedMenuCodes));

            runScript(tenantJdbcUrl, tenantSchemaFile, Collections.<String, String>emptyMap());
            runScript(tenantJdbcUrl, tenantBootstrapFile, bootstrapVariables);
            upsertTenantMenuCatalog(tenantJdbcUrl, expandedMenuCodes);

            List<String> optionalScripts = Arrays.asList(
                    tenantDraftingCategoryFile,
                    tenantElectronicApprovalFile,
                    tenantElectronicApprovalLikeFile,
                    tenantAttachmentFile
            );
            for (String optionalScript : optionalScripts) {
                runScriptSafely(tenantJdbcUrl, optionalScript, Collections.<String, String>emptyMap());
            }

            tenantInfoDAO.updateTenantDatabaseProvisioningStatus(tenantId, "ACTIVE");
        } catch (Exception ex) {
            tenantInfoDAO.updateTenantDatabaseProvisioningStatus(tenantId, "FAILED");
            throw new IllegalStateException("Tenant database provisioning failed for tenantId=" + tenantId + ", dbName=" + dbName, ex);
        }
    }

    private void createDatabaseIfMissing(String databaseName) throws Exception {
        try (Connection connection = openConnection(resolveJdbcUrl(MAINTENANCE_DATABASE));
                Statement statement = connection.createStatement()) {
            connection.setAutoCommit(true);

            try (ResultSet resultSet = statement.executeQuery(
                    "SELECT 1 FROM pg_database WHERE datname = '" + databaseName + "'")) {
                if (resultSet.next()) {
                    return;
                }
            }

            statement.execute("CREATE DATABASE \"" + databaseName + "\"");
        }
    }

    boolean runScriptSafely(String jdbcUrl, String configuredPath, Map<String, String> variables) {
        try {
            runScript(jdbcUrl, configuredPath, variables);
            return true;
        } catch (Exception ex) {
            log.warn("Skipping optional tenant SQL script {} because it is not required for provisioning: {}",
                    configuredPath, ex.getMessage());
            return false;
        }
    }

    private void runScript(String jdbcUrl, String configuredPath, Map<String, String> variables) throws Exception {
        String scriptPath = TenantSchemaScript.resolveScriptPath(configuredPath, System.getProperty("user.dir"));
        String script = TenantSchemaScript.readScript(configuredPath, System.getProperty("user.dir"));

        if (!variables.isEmpty()) {
            script = TenantSchemaScript.bindVariables(script, variables);
        }

        if (script == null || script.trim().isEmpty()) {
            return;
        }

        List<String> statements = TenantSchemaScript.splitStatements(script);
        if (statements.isEmpty()) {
            return;
        }

        try (Connection connection = openConnection(jdbcUrl)) {
            connection.setAutoCommit(false);
            try (Statement statement = connection.createStatement()) {
                for (String sqlStatement : statements) {
                    if (sqlStatement == null || sqlStatement.trim().isEmpty()) {
                        continue;
                    }
                    statement.execute(sqlStatement);
                }
                connection.commit();
            } catch (Exception ex) {
                connection.rollback();
                throw new IllegalStateException("Failed to apply tenant SQL file: " + scriptPath, ex);
            }
        }
    }

    private void upsertTenantMenuCatalog(String tenantJdbcUrl, List<String> expandedMenuCodes) throws Exception {
        if (expandedMenuCodes == null || expandedMenuCodes.isEmpty()) {
            return;
        }

        List<String> orderedMenuCodes = new ArrayList<String>();
        Set<String> seenMenuCodes = new LinkedHashSet<String>();
        for (String menuCode : expandedMenuCodes) {
            if (menuCode == null || menuCode.trim().isEmpty()) {
                continue;
            }
            String normalized = menuCode.trim().toUpperCase();
            if (normalized.matches("[A-Z0-9_]+") && seenMenuCodes.add(normalized)) {
                orderedMenuCodes.add(normalized);
            }
        }
        if (orderedMenuCodes.isEmpty()) {
            return;
        }

        List<MenuCatalogRow> sourceRows = resolveSourceMenuCatalogRows(orderedMenuCodes);
        if (sourceRows.isEmpty()) {
            return;
        }

        try (Connection tenantConnection = openConnection(tenantJdbcUrl)) {
            try (PreparedStatement insertStatement = tenantConnection.prepareStatement(
                    "INSERT INTO public.tb_menu (parent_menu_id, menu_code, menu_nm, menu_dc, menu_url, icon_nm, menu_order, use_at, created_at, updated_at) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, 'Y', NOW(), NOW()) " +
                    "ON CONFLICT (menu_code) DO UPDATE SET " +
                    "parent_menu_id = EXCLUDED.parent_menu_id, " +
                    "menu_nm = EXCLUDED.menu_nm, " +
                    "menu_dc = EXCLUDED.menu_dc, " +
                    "menu_url = EXCLUDED.menu_url, " +
                    "icon_nm = EXCLUDED.icon_nm, " +
                    "menu_order = EXCLUDED.menu_order, " +
                    "use_at = 'Y', " +
                    "updated_at = NOW()")) {

                Map<String, Long> localMenuIdByCode = new HashMap<String, Long>();
                for (MenuCatalogRow sourceRow : sourceRows) {
                    Long parentMenuId = null;
                    if (sourceRow.parentMenuCode != null && !sourceRow.parentMenuCode.trim().isEmpty()) {
                        parentMenuId = localMenuIdByCode.get(sourceRow.parentMenuCode.trim().toUpperCase());
                    }
                    if (parentMenuId != null) {
                        insertStatement.setLong(1, parentMenuId);
                    } else {
                        insertStatement.setNull(1, java.sql.Types.BIGINT);
                    }
                    insertStatement.setString(2, sourceRow.menuCode);
                    insertStatement.setString(3, sourceRow.menuNm);
                    insertStatement.setString(4, sourceRow.menuDc);
                    insertStatement.setString(5, sourceRow.menuUrl);
                    insertStatement.setString(6, sourceRow.iconNm);
                    if (sourceRow.menuOrder == null) {
                        insertStatement.setNull(7, java.sql.Types.INTEGER);
                    } else {
                        insertStatement.setInt(7, sourceRow.menuOrder);
                    }
                    insertStatement.executeUpdate();

                    try (PreparedStatement selectStatement = tenantConnection.prepareStatement(
                            "SELECT menu_id FROM public.tb_menu WHERE menu_code = ? LIMIT 1")) {
                        selectStatement.setString(1, sourceRow.menuCode);
                        try (ResultSet resultSet = selectStatement.executeQuery()) {
                            if (resultSet.next()) {
                                localMenuIdByCode.put(sourceRow.menuCode, resultSet.getLong("menu_id"));
                            }
                        }
                    }
                }
            }
        }
    }

    private List<MenuCatalogRow> resolveSourceMenuCatalogRows(List<String> menuCodes) throws Exception {
        if (menuCodes == null || menuCodes.isEmpty()) {
            return Collections.emptyList();
        }
        Set<String> requestedMenuCodes = new LinkedHashSet<String>();
        for (String menuCode : menuCodes) {
            String normalized = menuCode == null ? "" : menuCode.trim().toUpperCase();
            if (!normalized.isEmpty() && normalized.matches("[A-Z0-9_]+")) {
                requestedMenuCodes.add(normalized);
            }
        }
        if (requestedMenuCodes.isEmpty()) {
            return Collections.emptyList();
        }

        String placeholders = requestedMenuCodes.stream().map(code -> "?").collect(Collectors.joining(","));
        String sql = "SELECT menu_id, parent_menu_id, menu_code, menu_nm, menu_dc, menu_url, icon_nm, menu_order " +
                "FROM public.tb_menu WHERE menu_code IN (" + placeholders + ") ORDER BY menu_order, menu_id";

        try (Connection centralConnection = openConnection(postgresUrl);
                PreparedStatement statement = centralConnection.prepareStatement(sql)) {
            int index = 1;
            for (String menuCode : requestedMenuCodes) {
                statement.setString(index++, menuCode);
            }

            List<MenuCatalogRow> rows = new ArrayList<MenuCatalogRow>();
            try (ResultSet resultSet = statement.executeQuery()) {
                while (resultSet.next()) {
                    Long parentMenuId = resultSet.getObject("parent_menu_id") == null
                            ? null
                            : resultSet.getLong("parent_menu_id");
                    String parentMenuCode = parentMenuId == null ? null : resolveMenuCodeById(centralConnection, parentMenuId);
                    rows.add(new MenuCatalogRow(
                            resultSet.getString("menu_code"),
                            resultSet.getString("menu_nm"),
                            resultSet.getString("menu_dc"),
                            resultSet.getString("menu_url"),
                            resultSet.getString("icon_nm"),
                            resultSet.getObject("menu_order") == null ? null : resultSet.getInt("menu_order"),
                            parentMenuCode));
                }
            }
            return rows;
        }
    }

    private static final class MenuCatalogRow {
        private final String menuCode;
        private final String menuNm;
        private final String menuDc;
        private final String menuUrl;
        private final String iconNm;
        private final Integer menuOrder;
        private final String parentMenuCode;

        private MenuCatalogRow(String menuCode, String menuNm, String menuDc, String menuUrl, String iconNm, Integer menuOrder, String parentMenuCode) {
            this.menuCode = menuCode;
            this.menuNm = menuNm;
            this.menuDc = menuDc;
            this.menuUrl = menuUrl;
            this.iconNm = iconNm;
            this.menuOrder = menuOrder;
            this.parentMenuCode = parentMenuCode;
        }
    }

    private void executeStatement(String jdbcUrl, String sql) throws Exception {
        try (Connection connection = openConnection(jdbcUrl);
                Statement statement = connection.createStatement()) {
            connection.setAutoCommit(true);
            statement.execute(sql);
        }
    }

    private Connection openConnection(String jdbcUrl) throws Exception {
        Connection connection = DriverManager.getConnection(jdbcUrl, adminUser, adminPassword);
        configureConnectionForUtf8(connection);
        return connection;
    }

    private void configureConnectionForUtf8(Connection connection) throws Exception {
        if (connection == null) {
            return;
        }
        try (Statement statement = connection.createStatement()) {
            statement.execute("SET client_encoding TO 'UTF8'");
        }
    }

    private String normalizeMenuCodes(List<String> menuCodes, List<String> fallbackMenuCodes) {
        List<String> merged = new java.util.ArrayList<String>();
        if (menuCodes != null) {
            menuCodes.stream()
                    .filter(code -> code != null && !code.trim().isEmpty())
                    .map(code -> code.trim().toUpperCase())
                    .filter(code -> code.matches("[A-Z0-9_]+"))
                    .forEach(merged::add);
        }

        if (merged.isEmpty() && fallbackMenuCodes != null) {
            fallbackMenuCodes.stream()
                    .filter(code -> code != null && !code.trim().isEmpty())
                    .map(code -> code.trim().toUpperCase())
                    .filter(code -> code.matches("[A-Z0-9_]+"))
                    .forEach(merged::add);
        }

        return merged.stream().distinct().collect(Collectors.joining(","));
    }

    private List<String> resolveFallbackMenuCodes(String planCode) {
        String normalizedPlanCode = planCode == null ? "" : planCode.trim().toUpperCase();
        if ("B".equals(normalizedPlanCode) || "C".equals(normalizedPlanCode)) {
            return Arrays.asList(
                    "MENU_TENANT_DASHBOARD",
                    "MENU_TENANT_USERS",
                    "MENU_TENANT_DEPARTMENTS",
                    "MENU_TENANT_DOCUMENTS",
                    "MENU_TENANT_HISTORY");
        }
        if ("P".equals(normalizedPlanCode)) {
            return Arrays.asList(
                    "MENU_PLATFORM_ROOT",
                    "MENU_DOCUMENT_ROOT",
                    "MENU_SYSTEM_ROOT",
                    "MENU_PLAN_MANAGEMENT",
                    "MENU_MENU_MANAGEMENT",
                    "MENU_AUTHORITY_MANAGEMENT",
                    "MENU_TENANT_MANAGEMENT",
                    "MENU_LOGIN_HISTORY",
                    "MENU_TENANT_USERS",
                    "MENU_TENANT_DEPARTMENTS",
                    "MENU_TENANT_DOCUMENTS",
                    "MENU_TENANT_HISTORY",
                    "MENU_TENANT_DASHBOARD");
        }
        return Arrays.asList(
                "MENU_TENANT_DASHBOARD",
                "MENU_TENANT_USERS",
                "MENU_TENANT_DEPARTMENTS",
                "MENU_TENANT_HISTORY");
    }

    private List<String> expandMenuCodesWithAncestors(List<String> menuCodes) {
        Set<String> expanded = new LinkedHashSet<String>();
        if (menuCodes == null || menuCodes.isEmpty()) {
            return new ArrayList<String>(expanded);
        }

        try (Connection connection = openConnection(postgresUrl)) {
            for (String menuCode : menuCodes) {
                collectAncestorMenuCodes(connection, menuCode, expanded);
            }
        } catch (Exception ex) {
            log.warn("Failed to expand ancestor menu codes. Falling back to requested set. reason={}", ex.getMessage());
        }

        List<String> ordered = new ArrayList<String>();
        for (String menuCode : menuCodes) {
            if (menuCode != null && !menuCode.trim().isEmpty()) {
                String normalized = menuCode.trim().toUpperCase();
                if (normalized.matches("[A-Z0-9_]+")) {
                    ordered.add(normalized);
                }
            }
        }
        for (String menuCode : expanded) {
            if (!ordered.contains(menuCode)) {
                ordered.add(menuCode);
            }
        }
        return ordered;
    }

    private void collectAncestorMenuCodes(Connection connection, String menuCode, Set<String> expanded) throws Exception {
        if (menuCode == null) {
            return;
        }

        String normalized = menuCode.trim().toUpperCase();
        if (normalized.isEmpty() || !normalized.matches("[A-Z0-9_]+")) {
            return;
        }

        Set<String> visited = new LinkedHashSet<String>();
        String currentCode = normalized;
        while (currentCode != null && !currentCode.isEmpty() && !visited.contains(currentCode)) {
            visited.add(currentCode);
            expanded.add(currentCode);

            Long parentMenuId = resolveParentMenuIdByCode(connection, currentCode);
            if (parentMenuId == null) {
                return;
            }
            String parentCode = resolveMenuCodeById(connection, parentMenuId);
            if (parentCode == null || parentCode.trim().isEmpty()) {
                return;
            }
            currentCode = parentCode.trim().toUpperCase();
        }
    }

    private Long resolveParentMenuIdByCode(Connection connection, String menuCode) throws Exception {
        if (menuCode == null || menuCode.trim().isEmpty()) {
            return null;
        }
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT parent_menu_id FROM public.tb_menu WHERE menu_code = ? LIMIT 1")) {
            statement.setString(1, menuCode.trim().toUpperCase());
            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    Object value = resultSet.getObject("parent_menu_id");
                    return value == null ? null : resultSet.getLong("parent_menu_id");
                }
            }
        }
        return null;
    }

    private String resolveMenuCatalog(List<String> menuCodes) {
        Set<String> requestedMenuCodes = new LinkedHashSet<String>();
        if (menuCodes != null) {
            for (String menuCode : menuCodes) {
                if (menuCode == null) {
                    continue;
                }
                String normalized = menuCode.trim().toUpperCase();
                if (!normalized.isEmpty() && normalized.matches("[A-Z0-9_]+")) {
                    requestedMenuCodes.add(normalized);
                }
            }
        }
        if (requestedMenuCodes.isEmpty()) {
            return "";
        }

        String placeholders = requestedMenuCodes.stream()
                .map(code -> "?")
                .collect(Collectors.joining(","));

        String sql = "SELECT menu_id, parent_menu_id, menu_code, menu_nm, menu_dc, menu_url, icon_nm, menu_order "
                + "FROM public.tb_menu WHERE menu_code IN (" + placeholders + ") ORDER BY menu_order, menu_id";

        try (Connection connection = openConnection(postgresUrl);
                PreparedStatement statement = connection.prepareStatement(sql)) {
            int index = 1;
            for (String menuCode : requestedMenuCodes) {
                statement.setString(index++, menuCode);
            }

            List<String> rows = new ArrayList<String>();
            try (ResultSet resultSet = statement.executeQuery()) {
                while (resultSet.next()) {
                    String menuCode = resultSet.getString("menu_code");
                    String menuNm = resultSet.getString("menu_nm");
                    String menuDc = resultSet.getString("menu_dc");
                    String menuUrl = resultSet.getString("menu_url");
                    String iconNm = resultSet.getString("icon_nm");
                    Integer menuOrder = resultSet.getObject("menu_order") == null
                            ? null
                            : resultSet.getInt("menu_order");
                    String parentMenuCode = null;
                    Long parentMenuId = resultSet.getObject("parent_menu_id") == null
                            ? null
                            : resultSet.getLong("parent_menu_id");
                    if (parentMenuId != null) {
                        parentMenuCode = resolveMenuCodeById(connection, parentMenuId);
                    }
                    rows.add(serializeMenuCatalogRow(menuCode, menuNm, menuDc, menuUrl, iconNm, menuOrder, parentMenuCode));
                }
            }
            return rows.stream().filter(row -> row != null && !row.trim().isEmpty()).collect(Collectors.joining(";"));
        } catch (Exception ex) {
            log.warn("Failed to resolve source tenant menu catalog. Falling back to empty catalog. reason={}", ex.getMessage());
            return "";
        }
    }

    private String resolveMenuCodeById(Connection connection, Long menuId) throws Exception {
        if (menuId == null) {
            return null;
        }
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT menu_code FROM public.tb_menu WHERE menu_id = ? LIMIT 1")) {
            statement.setLong(1, menuId);
            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    return resultSet.getString("menu_code");
                }
            }
        }
        return null;
    }

    private String serializeMenuCatalogRow(
            String menuCode,
            String menuNm,
            String menuDc,
            String menuUrl,
            String iconNm,
            Integer menuOrder,
            String parentMenuCode) {
        if (menuCode == null || menuCode.trim().isEmpty()) {
            return "";
        }

        String normalizedMenuCode = menuCode.trim().toUpperCase();
        String normalizedMenuNm = menuNm == null ? "" : menuNm.replace('|', ' ');
        String normalizedMenuDc = menuDc == null ? "" : menuDc.replace('|', ' ');
        String normalizedMenuUrl = menuUrl == null ? "" : menuUrl.replace('|', ' ');
        String normalizedIconNm = iconNm == null ? "" : iconNm.replace('|', ' ');
        String normalizedParentMenuCode = parentMenuCode == null ? "" : parentMenuCode.trim().replace('|', ' ');
        String normalizedMenuOrder = menuOrder == null ? "" : String.valueOf(menuOrder);

        return String.join("|",
                normalizedMenuCode,
                normalizedMenuNm,
                normalizedMenuDc,
                normalizedMenuUrl,
                normalizedIconNm,
                normalizedMenuOrder,
                normalizedParentMenuCode);
    }

    private String resolveJdbcUrl(String databaseName) {
        PostgresConnection connection = resolvePostgresConnection();
        return "jdbc:postgresql://" + connection.host + ":" + connection.port + "/" + databaseName;
    }

    private String normalizeIdentifier(String identifier) {
        String normalized = identifier.trim().toLowerCase();
        if (!normalized.matches("[a-z0-9_]+")) {
            throw new IllegalArgumentException("Invalid PostgreSQL identifier: " + identifier);
        }
        return normalized;
    }

    private PostgresConnection resolvePostgresConnection() {
        String configuredUrl = postgresUrl == null ? "" : postgresUrl.trim();
        int schemeIndex = configuredUrl.indexOf("postgresql://");
        if (schemeIndex < 0) {
            return new PostgresConnection("localhost", 5432);
        }

        try {
            URI uri = new URI(configuredUrl.substring(schemeIndex));
            String host = uri.getHost();
            int port = uri.getPort() > 0 ? uri.getPort() : 5432;
            if (host == null || host.trim().isEmpty()) {
                return new PostgresConnection("localhost", 5432);
            }
            return new PostgresConnection(host, port);
        } catch (Exception ex) {
            return new PostgresConnection("localhost", 5432);
        }
    }

    private static final class PostgresConnection {
        private final String host;
        private final int port;

        private PostgresConnection(String host, int port) {
            this.host = host;
            this.port = port;
        }
    }
}
