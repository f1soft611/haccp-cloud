package egovframework.let.platform_admin.tenants.context;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

import javax.sql.DataSource;

import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;
import org.springframework.util.StringUtils;

public class TenantRoutingDataSource extends AbstractRoutingDataSource {

    private final Map<Object, Object> targetDataSources = new HashMap<>();
    private String postgresJdbcUrl;
    private String postgresUsername;
    private String postgresPassword;

    public void setPostgresJdbcUrl(String postgresJdbcUrl) {
        this.postgresJdbcUrl = postgresJdbcUrl;
    }

    public void setPostgresUsername(String postgresUsername) {
        this.postgresUsername = postgresUsername;
    }

    public void setPostgresPassword(String postgresPassword) {
        this.postgresPassword = postgresPassword;
    }

    @Override
    protected Object determineCurrentLookupKey() {
        String dbKey = TenantContextHolder.getDbKey();
        if (!StringUtils.hasText(dbKey)) {
            return PlatformTenantCodes.CANONICAL;
        }

        String normalizedDbKey = dbKey.trim().toUpperCase();
        synchronized (this) {
            if (!targetDataSources.containsKey(normalizedDbKey)) {
                registerTenantDataSource(normalizedDbKey);
            }
        }
        return normalizedDbKey;
    }

    @Override
    public void setTargetDataSources(Map<Object, Object> targetDataSources) {
        super.setTargetDataSources(targetDataSources);
        this.targetDataSources.clear();
        this.targetDataSources.putAll(targetDataSources);
    }

    public Map<Object, Object> getTargetDataSourcesSnapshot() {
        return new HashMap<>(this.targetDataSources);
    }

    private void registerTenantDataSource(String dbKey) {
        if (!StringUtils.hasText(dbKey) || PlatformTenantCodes.isPlatform(dbKey)) {
            return;
        }

        String databaseName = resolveDatabaseName(dbKey);
        if (!StringUtils.hasText(databaseName) || !StringUtils.hasText(postgresJdbcUrl)) {
            return;
        }

        DataSource tenantDataSource = buildTenantDataSource(databaseName);
        if (tenantDataSource != null) {
            targetDataSources.put(dbKey, tenantDataSource);
            super.setTargetDataSources(new HashMap<>(targetDataSources));
            super.afterPropertiesSet();
        }
    }

    private DataSource buildTenantDataSource(String databaseName) {
        try {
            URI uri = resolvePostgresUri(postgresJdbcUrl);
            if (uri == null) {
                return null;
            }

            String host = uri.getHost();
            if (!StringUtils.hasText(host)) {
                return null;
            }

            int port = uri.getPort() > 0 ? uri.getPort() : 5432;
            String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + databaseName;

            DriverManagerDataSource dataSource = new DriverManagerDataSource();
            dataSource.setDriverClassName("org.postgresql.Driver");
            dataSource.setUrl(jdbcUrl);
            dataSource.setUsername(postgresUsername);
            dataSource.setPassword(postgresPassword);
            return dataSource;
        } catch (Exception ex) {
            return null;
        }
    }

    private URI resolvePostgresUri(String configuredUrl) {
        if (!StringUtils.hasText(configuredUrl)) {
            return null;
        }

        String trimmed = configuredUrl.trim();
        int schemeIndex = trimmed.indexOf("postgresql://");
        if (schemeIndex >= 0) {
            trimmed = trimmed.substring(schemeIndex);
        }

        try {
            return URI.create(trimmed);
        } catch (Exception ex) {
            return null;
        }
    }

    private String resolveDatabaseName(String dbKey) {
        String normalized = PlatformTenantCodes.normalize(dbKey);
        if (PlatformTenantCodes.isPlatform(normalized)) {
            return null;
        }

        if (normalized.startsWith("TENANT_")) {
            normalized = normalized.substring("TENANT_".length());
        }

        if (!StringUtils.hasText(normalized)) {
            return null;
        }

        return "tenant_" + normalized;
    }
}
