import java.sql.*;
public class DbProbe {
  public static void main(String[] args) throws Exception {
    String url = "jdbc:log4jdbc:postgresql://218.155.74.34:5433/haccp_cloud";
    String user = "postgres";
    String pass = "f1soft@96";
    String dbName = "tenant_probe_20260821";
    System.out.println("--- JDBC probe start ---");
    try (Connection c = DriverManager.getConnection(url, user, pass)) {
      System.out.println("main_conn_ok=true");
      try (Statement s = c.createStatement(); ResultSet rs = s.executeQuery("SELECT current_user, version();")) {
        while (rs.next()) {
          System.out.println("current_user=" + rs.getString(1));
          System.out.println("version=" + rs.getString(2));
        }
      }
      try (Statement s = c.createStatement(); ResultSet rs = s.executeQuery("SELECT has_database_privilege(current_user, 'postgres', 'CREATE');")) {
        while (rs.next()) {
          System.out.println("create_privilege=" + rs.getBoolean(1));
        }
      }
      try (Statement s = c.createStatement(); ResultSet rs = s.executeQuery("SELECT datname FROM pg_database WHERE datname = '" + dbName + "';")) {
        System.out.println("db_exists_before=" + rs.next());
      }
      try (Statement s = c.createStatement()) {
        s.execute("CREATE DATABASE \"" + dbName + "\"");
        System.out.println("create_db_ok=true");
      } catch (Exception e) {
        System.out.println("create_db_ok=false");
        e.printStackTrace(System.out);
      }
      try (Connection d = DriverManager.getConnection("jdbc:postgresql://218.155.74.34:5433/" + dbName, user, pass)) {
        System.out.println("probe_db_connect_ok=true");
      } catch (Exception e) {
        System.out.println("probe_db_connect_ok=false");
        e.printStackTrace(System.out);
      }
      try (Connection d = DriverManager.getConnection("jdbc:postgresql://218.155.74.34:5433/postgres", user, pass);
           Statement s = d.createStatement()) {
        s.execute("DROP DATABASE \"" + dbName + "\"");
        System.out.println("drop_db_ok=true");
      } catch (Exception e) {
        System.out.println("drop_db_ok=false");
        e.printStackTrace(System.out);
      }
    } catch (Exception e) {
      System.out.println("main_conn_ok=false");
      e.printStackTrace(System.out);
    }
  }
}