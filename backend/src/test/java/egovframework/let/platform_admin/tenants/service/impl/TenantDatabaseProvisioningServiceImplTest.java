package egovframework.let.platform_admin.tenants.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.lang.reflect.Method;
import java.util.Arrays;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class TenantDatabaseProvisioningServiceImplTest {

    @Test
    void resolvesHostAndPortFromConfiguredPostgresUrl() throws Exception {
        TenantDatabaseProvisioningServiceImpl service = new TenantDatabaseProvisioningServiceImpl();
        ReflectionTestUtils.setField(
                service,
                "postgresUrl",
                "jdbc:log4jdbc:postgresql://218.155.74.34:5433/haccp_cloud_central");

        Method resolveConnection = TenantDatabaseProvisioningServiceImpl.class
                .getDeclaredMethod("resolvePostgresConnection");
        resolveConnection.setAccessible(true);

        Object connection = resolveConnection.invoke(service);

        assertEquals("218.155.74.34", ReflectionTestUtils.getField(connection, "host"));
        assertEquals(Integer.valueOf(5433), ReflectionTestUtils.getField(connection, "port"));

        Method normalizeMenuCodes = TenantDatabaseProvisioningServiceImpl.class
            .getDeclaredMethod("normalizeMenuCodes", java.util.List.class);
        normalizeMenuCodes.setAccessible(true);
        assertEquals(
            "MENU_A,MENU_B",
            normalizeMenuCodes.invoke(service, Arrays.asList(" menu_a ", "MENU_B", "MENU_A")));
    }

    @Test
    void buildsPlainJdbcUrlForTargetDatabase() throws Exception {
        TenantDatabaseProvisioningServiceImpl service = new TenantDatabaseProvisioningServiceImpl();
        ReflectionTestUtils.setField(
                service,
                "postgresUrl",
                "jdbc:log4jdbc:postgresql://218.155.74.34:5433/haccp_cloud_central");

        Method resolveJdbcUrl = TenantDatabaseProvisioningServiceImpl.class
                .getDeclaredMethod("resolveJdbcUrl", String.class);
        resolveJdbcUrl.setAccessible(true);

        assertEquals(
                "jdbc:postgresql://218.155.74.34:5433/tenant_2608200001",
                resolveJdbcUrl.invoke(service, "tenant_2608200001"));
        assertEquals(
                "jdbc:postgresql://218.155.74.34:5433/postgres",
                resolveJdbcUrl.invoke(service, "postgres"));
    }
}