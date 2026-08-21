import java.sql.*;
public class ProbeDbAccess {
  public static void main(String[] args) throws Exception {
    String url = "jdbc:postgresql://218.155.74.34:5433/postgres";
    String user = "postgres";
    String pass = "f1soft@96";
    try (Connection c = DriverManager.getConnection(url, user, pass)) {
      System.out.println("connected");
      try (Statement st = c.createStatement()) {
        ResultSet rs = st.executeQuery("SELECT current_user, current_database(), version() ");
        if (rs.next()) {
          System.out.println("current_user=" + rs.getString(1));
          System.out.println("current_database=" + rs.getString(2));
          System.out.println("version=" + rs.getString(3));
        }
      }
      String db = "tenant_probe_" + System.currentTimeMillis();
      try (Statement st = c.createStatement()) {
        st.execute("CREATE DATABASE \"" + db + "\"");
        System.out.println("created=" + db);
      }
      try (Statement st = c.createStatement()) {
        st.execute("DROP DATABASE IF EXISTS \"" + db + "\"");
        System.out.println("dropped=" + db);
      }
    }
  }
}