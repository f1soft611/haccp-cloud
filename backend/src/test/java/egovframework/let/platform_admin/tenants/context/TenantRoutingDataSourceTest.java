package egovframework.let.platform_admin.tenants.context;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

import javax.sql.DataSource;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

class TenantRoutingDataSourceTest {

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @DisplayName("기본값은 플랫폼 데이터소스를 사용한다")
    @Test
    void usesPlatformDataSourceByDefault() {
        TenantRoutingDataSource routingDataSource = new TenantRoutingDataSource();
        routingDataSource.setDefaultTargetDataSource(new DriverManagerDataSource());

        assertEquals("PLATFORM", routingDataSource.determineCurrentLookupKey());
    }

    @DisplayName("tenant context가 있으면 해당 tenant db key를 사용한다")
    @Test
    void usesTenantDbKeyWhenContextExists() {
        TenantContextHolder.setDbKey("TENANT_0001");

        TenantRoutingDataSource routingDataSource = new TenantRoutingDataSource();
        routingDataSource.setDefaultTargetDataSource(new DriverManagerDataSource());

        assertEquals("TENANT_0001", routingDataSource.determineCurrentLookupKey());
    }

    @DisplayName("log4jdbc PostgreSQL URL에서도 tenant 데이터소스를 동적으로 등록한다")
    @Test
    void registersTenantDataSourceWithLog4JdbcUrl() {
        TenantContextHolder.setDbKey("TENANT_1101234567");

        TenantRoutingDataSource routingDataSource = new TenantRoutingDataSource();
        DriverManagerDataSource platformDataSource = new DriverManagerDataSource();
        platformDataSource.setUrl("jdbc:postgresql://218.155.74.34:5433/haccp_cloud_central");

        routingDataSource.setDefaultTargetDataSource(platformDataSource);
        routingDataSource.setPostgresJdbcUrl("jdbc:log4jdbc:postgresql://218.155.74.34:5433/haccp_cloud_central");
        routingDataSource.setPostgresUsername("postgres");
        routingDataSource.setPostgresPassword("secret");

        Map<Object, Object> targets = new HashMap<Object, Object>();
        targets.put("PLATFORM", platformDataSource);
        routingDataSource.setTargetDataSources(targets);
        routingDataSource.afterPropertiesSet();

        assertEquals("TENANT_1101234567", routingDataSource.determineCurrentLookupKey());

        Map<Object, Object> snapshot = routingDataSource.getTargetDataSourcesSnapshot();
        assertTrue(snapshot.containsKey("TENANT_1101234567"));

        Object tenantDataSource = snapshot.get("TENANT_1101234567");
        assertNotNull(tenantDataSource);
        assertTrue(tenantDataSource instanceof DriverManagerDataSource);
        assertEquals(
                "jdbc:postgresql://218.155.74.34:5433/tenant_1101234567",
                ((DriverManagerDataSource) tenantDataSource).getUrl());

        DataSource selectedDataSource = resolveTargetDataSource(routingDataSource);
        assertTrue(selectedDataSource instanceof DriverManagerDataSource);
        assertEquals(
            "jdbc:postgresql://218.155.74.34:5433/tenant_1101234567",
            ((DriverManagerDataSource) selectedDataSource).getUrl());
    }

    @DisplayName("PostgreSQL URL을 파싱할 수 없으면 tenant 데이터소스를 등록하지 않는다")
    @Test
    void skipsTenantDataSourceRegistrationWhenUrlInvalid() {
        TenantContextHolder.setDbKey("TENANT_1101234567");

        TenantRoutingDataSource routingDataSource = new TenantRoutingDataSource();
        DriverManagerDataSource platformDataSource = new DriverManagerDataSource();
        routingDataSource.setDefaultTargetDataSource(platformDataSource);
        routingDataSource.setPostgresJdbcUrl("not-a-postgres-url");
        routingDataSource.setPostgresUsername("postgres");
        routingDataSource.setPostgresPassword("secret");

        Map<Object, Object> targets = new HashMap<Object, Object>();
        targets.put("PLATFORM", platformDataSource);
        routingDataSource.setTargetDataSources(targets);
        routingDataSource.afterPropertiesSet();

        assertEquals("TENANT_1101234567", routingDataSource.determineCurrentLookupKey());

        Map<Object, Object> snapshot = routingDataSource.getTargetDataSourcesSnapshot();
        assertTrue(snapshot.containsKey("PLATFORM"));
        assertNull(snapshot.get("TENANT_1101234567"));

        DataSource selectedDataSource = resolveTargetDataSource(routingDataSource);
        assertEquals(platformDataSource, selectedDataSource);
    }

    private DataSource resolveTargetDataSource(TenantRoutingDataSource routingDataSource) {
        try {
            Method method = org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource.class
                    .getDeclaredMethod("determineTargetDataSource");
            method.setAccessible(true);
            return (DataSource) method.invoke(routingDataSource);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to resolve target datasource", ex);
        }
    }
}
