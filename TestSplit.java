import java.nio.file.*;
import java.util.*;
public class TestSplit {
  public static void main(String[] args) throws Exception {
    String s = Files.readString(Path.of("DATABASE", "migrate_postgresql_add_document_attachment_tables.sql"));
    System.out.println("lines=" + s.split("\\r?\\n").length);
    List<String> parts = egovframework.let.platform_admin.tenants.service.impl.TenantSchemaScript.splitStatements(s);
    System.out.println("parts=" + parts.size());
    for (int i=0;i<Math.min(parts.size(),10);i++) { System.out.println("P"+i+":"+parts.get(i).substring(0,Math.min(120,parts.get(i).length()))); }
  }
}