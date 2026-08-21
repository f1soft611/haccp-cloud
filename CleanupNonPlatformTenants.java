import java.sql.*;
public class CleanupNonPlatformTenants {
  public static void main(String[] args) throws Exception {
    String url = "jdbc:postgresql://218.155.74.34:5433/haccp_cloud";
    String user = "postgres";
    String pass = "f1soft@96";

    try (Connection c = DriverManager.getConnection(url, user, pass)) {
      c.setAutoCommit(false);
      try {
        try (PreparedStatement s = c.prepareStatement("SELECT COUNT(*) FROM public.tb_tenant WHERE tenant_code <> 'PLATFORM'")) {
          ResultSet rs = s.executeQuery();
          if (rs.next()) {
            System.out.println("non_platform_before=" + rs.getInt(1));
          }
        }

        String[] deletes = new String[] {
          "DELETE FROM public.tb_tenant_domain WHERE tenant_id IN (SELECT tenant_id FROM public.tb_tenant WHERE tenant_code <> 'PLATFORM')",
          "DELETE FROM public.tb_tenant_auth_token WHERE tenant_id IN (SELECT tenant_id FROM public.tb_tenant WHERE tenant_code <> 'PLATFORM')",
          "DELETE FROM public.tb_tenant_database WHERE tenant_id IN (SELECT tenant_id FROM public.tb_tenant WHERE tenant_code <> 'PLATFORM')",
          "DELETE FROM public.tb_login_account_role WHERE login_id IN (SELECT login_id FROM public.tb_login_account WHERE tenant_id IN (SELECT tenant_id FROM public.tb_tenant WHERE tenant_code <> 'PLATFORM'))",
          "DELETE FROM public.tb_login_account WHERE tenant_id IN (SELECT tenant_id FROM public.tb_tenant WHERE tenant_code <> 'PLATFORM')",
          "DELETE FROM public.tb_user WHERE tenant_id IN (SELECT tenant_id FROM public.tb_tenant WHERE tenant_code <> 'PLATFORM')",
          "DELETE FROM public.tb_permission WHERE tenant_id IN (SELECT tenant_id FROM public.tb_tenant WHERE tenant_code <> 'PLATFORM')",
          "DELETE FROM public.tb_role WHERE tenant_id IN (SELECT tenant_id FROM public.tb_tenant WHERE tenant_code <> 'PLATFORM')",
          "DELETE FROM public.tb_tenant WHERE tenant_code <> 'PLATFORM'"
        };

        for (String sql : deletes) {
          try (PreparedStatement s = c.prepareStatement(sql)) {
            int count = s.executeUpdate();
            System.out.println("executed=" + count + " :: " + sql.substring(0, Math.min(60, sql.length())));
          }
        }

        c.commit();

        try (PreparedStatement s = c.prepareStatement("SELECT tenant_id, tenant_code FROM public.tb_tenant ORDER BY tenant_id")) {
          ResultSet rs = s.executeQuery();
          System.out.println("--- remaining tenants ---");
          while (rs.next()) {
            System.out.println(rs.getLong(1) + " | " + rs.getString(2));
          }
        }
      } catch (Exception e) {
        c.rollback();
        throw e;
      }
    }
  }
}