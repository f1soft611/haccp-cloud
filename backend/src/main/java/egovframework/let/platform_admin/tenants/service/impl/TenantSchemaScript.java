package egovframework.let.platform_admin.tenants.service.impl;

import java.io.File;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;

/**
 * 테넌트 DB 초기화 SQL 스크립트를 JDBC로 실행하기 위한 전처리 유틸.
 */
public final class TenantSchemaScript {

    private static final Set<String> TRANSACTION_CONTROL_STATEMENTS =
            new LinkedHashSet<String>(Arrays.asList("BEGIN", "COMMIT", "ROLLBACK", "END", "START TRANSACTION"));

    private static final Pattern VARIABLE_PATTERN = Pattern.compile(":'([A-Za-z0-9_]+)'");
    private static final Pattern SAFE_VALUE_PATTERN = Pattern.compile("[A-Za-z0-9_(),.:/@#, -]*");

    private TenantSchemaScript() {
    }

    public static List<String> splitStatements(String script) {
        List<String> statements = new ArrayList<String>();
        if (script == null || script.trim().isEmpty()) {
            return statements;
        }

        StringBuilder current = new StringBuilder();
        boolean inLiteral = false;
        boolean inLineComment = false;
        boolean inBlockComment = false;
        boolean inDollarQuotedString = false;
        String dollarTag = null;

        for (int index = 0; index < script.length(); index++) {
            char currentChar = script.charAt(index);
            char nextChar = index + 1 < script.length() ? script.charAt(index + 1) : '\0';

            if (inLineComment) {
                if (currentChar == '\n') {
                    inLineComment = false;
                    current.append(currentChar);
                }
                continue;
            }

            if (inBlockComment) {
                if (currentChar == '*' && nextChar == '/') {
                    inBlockComment = false;
                    index++;
                }
                continue;
            }

            if (inDollarQuotedString) {
                if (currentChar == '$' && dollarTag != null && script.startsWith(dollarTag, index)) {
                    current.append(dollarTag);
                    index += dollarTag.length() - 1;
                    dollarTag = null;
                    inDollarQuotedString = false;
                    continue;
                }
                current.append(currentChar);
                continue;
            }

            if (!inLiteral && currentChar == '$') {
                String candidate = findDollarTag(script, index);
                if (candidate != null) {
                    dollarTag = candidate;
                    inDollarQuotedString = true;
                    current.append(candidate);
                    index += candidate.length() - 1;
                    continue;
                }
            }

            if (!inLiteral && currentChar == '-' && nextChar == '-') {
                inLineComment = true;
                index++;
                continue;
            }

            if (!inLiteral && currentChar == '/' && nextChar == '*') {
                inBlockComment = true;
                index++;
                continue;
            }

            if (currentChar == '\'') {
                inLiteral = !inLiteral;
                current.append(currentChar);
                continue;
            }

            if (!inLiteral && currentChar == ';') {
                addStatement(statements, current.toString());
                current.setLength(0);
                continue;
            }

            current.append(currentChar);
        }

        addStatement(statements, current.toString());
        return statements;
    }

    private static String findDollarTag(String script, int index) {
        if (index + 1 >= script.length()) {
            return null;
        }

        String remainder = script.substring(index);
        Matcher matcher = Pattern.compile("\\$\\$(?:\\$[A-Za-z_][A-Za-z0-9_]*\\$|\\$\\$)?").matcher(remainder);
        if (matcher.find() && matcher.start() == 0) {
            return matcher.group();
        }

        Matcher namedMatcher = Pattern.compile("\\$[A-Za-z_][A-Za-z0-9_]*\\$").matcher(remainder);
        if (namedMatcher.find() && namedMatcher.start() == 0) {
            return namedMatcher.group();
        }

        return null;
    }

    public static String bindVariables(String script, Map<String, String> variables) {
        if (script == null || script.isEmpty()) {
            return script;
        }

        Matcher matcher = VARIABLE_PATTERN.matcher(script);
        StringBuffer bound = new StringBuffer();

        while (matcher.find()) {
            String variableName = matcher.group(1);
            if (!variables.containsKey(variableName)) {
                throw new IllegalArgumentException("Unbound tenant script variable: " + variableName);
            }

            String rawValue = variables.get(variableName);
            String value = rawValue == null ? "" : rawValue.trim();
            if (!SAFE_VALUE_PATTERN.matcher(value).matches()) {
                throw new IllegalArgumentException("Unsafe tenant script variable value: " + variableName);
            }

            matcher.appendReplacement(bound, Matcher.quoteReplacement("'" + value + "'"));
        }
        matcher.appendTail(bound);

        return bound.toString();
    }

    public static String resolveScriptPath(String configuredPath, String workingDirectory) {
        if (configuredPath == null || configuredPath.trim().isEmpty()) {
            throw new IllegalArgumentException("Tenant script path is required");
        }

        String normalizedPath = configuredPath.trim().replace('\\', '/');
        File configuredFile = new File(normalizedPath);
        if (configuredFile.isAbsolute()) {
            return configuredFile.getPath();
        }

        List<String> candidatePaths = new ArrayList<String>();
        candidatePaths.add(normalizedPath);
        if (normalizedPath.startsWith("./")) {
            candidatePaths.add(normalizedPath.substring(2));
        }
        if (normalizedPath.startsWith("backend/")) {
            candidatePaths.add(normalizedPath.substring("backend/".length()));
        }
        if (normalizedPath.contains("/")) {
            String withoutFirstSegment = normalizedPath.substring(normalizedPath.indexOf('/') + 1);
            candidatePaths.add(withoutFirstSegment);
            if (normalizedPath.contains("DATABASE/")) {
                candidatePaths.add(normalizedPath.substring(normalizedPath.indexOf("DATABASE/")));
            }
        }

        File workingDir = new File(workingDirectory == null ? "." : workingDirectory).getAbsoluteFile();
        File currentDir = workingDir;
        for (int iteration = 0; iteration < 8 && currentDir != null; iteration++) {
            for (String candidatePath : candidatePaths) {
                File candidate = new File(currentDir, candidatePath);
                if (candidate.isFile()) {
                    try {
                        return candidate.getCanonicalPath();
                    } catch (Exception ex) {
                        return candidate.getAbsolutePath();
                    }
                }
            }
            currentDir = currentDir.getParentFile();
        }

        return resolveResourcePath(normalizedPath);
    }

    public static String readScript(String configuredPath, String workingDirectory) throws Exception {
        String normalizedPath = configuredPath == null ? "" : configuredPath.trim().replace('\\', '/');
        if (normalizedPath.isEmpty()) {
            throw new IllegalArgumentException("Tenant script path is required");
        }

        Resource resource = resolveScriptResource(normalizedPath);
        if (resource != null && resource.exists()) {
            try (InputStream inputStream = resource.getInputStream()) {
                byte[] bytes = new byte[inputStream.available()];
                int readCount = 0;
                while (readCount < bytes.length) {
                    int readNow = inputStream.read(bytes, readCount, bytes.length - readCount);
                    if (readNow < 0) {
                        break;
                    }
                    readCount += readNow;
                }
                return new String(bytes, StandardCharsets.UTF_8);
            }
        }

        String resolvedPath = resolveScriptPath(normalizedPath, workingDirectory);
        return new String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get(resolvedPath)), StandardCharsets.UTF_8);
    }

    private static Resource resolveScriptResource(String configuredPath) {
        String normalizedPath = configuredPath.trim().replace('\\', '/');
        List<String> candidates = new ArrayList<String>();
        candidates.add(normalizedPath);
        if (normalizedPath.startsWith("backend/")) {
            candidates.add(normalizedPath.substring("backend/".length()));
        }
        if (normalizedPath.startsWith("DATABASE/")) {
            candidates.add("sql/postgresql/" + normalizedPath.substring("DATABASE/".length()));
        }
        if (normalizedPath.startsWith("sql/")) {
            candidates.add(normalizedPath);
        }

        for (String candidate : candidates) {
            Resource resource = new ClassPathResource(candidate);
            if (resource.exists()) {
                return resource;
            }
        }

        return null;
    }

    private static String resolveResourcePath(String configuredPath) {
        Resource resource = resolveScriptResource(configuredPath);
        if (resource != null && resource.exists()) {
            try {
                return new FileSystemResource(resource.getFile()).getFile().getCanonicalPath();
            } catch (Exception ex) {
                return resource.getFilename() == null ? configuredPath : resource.getFilename();
            }
        }
        return configuredPath;
    }

    private static void addStatement(List<String> statements, String rawStatement) {
        String statement = rawStatement.trim();
        if (statement.isEmpty()) {
            return;
        }

        if (TRANSACTION_CONTROL_STATEMENTS.contains(statement.toUpperCase())) {
            return;
        }

        statements.add(statement);
    }
}
