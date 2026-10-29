package egovframework.let.platform_admin.migration.service;

import java.util.List;
import java.util.Map;

/**
 * DB 하나의 마이그레이션 이력(파일명 -> success_at)과 정렬된 파일 목록으로 파일 상태를 계산한다.
 */
public final class MigrationStatusRule {

    public static final String APPLIED = "APPLIED";
    public static final String FAILED = "FAILED";
    public static final String PENDING = "PENDING";
    public static final String BLOCKED = "BLOCKED";

    private MigrationStatusRule() {
    }

    public static String status(List<String> sortedIds, Map<String, String> successById, String migrationId) {
        if ("Y".equals(successById.get(migrationId))) {
            return APPLIED;
        }
        for (String previousId : sortedIds) {
            if (previousId.equals(migrationId)) {
                break;
            }
            if (!"Y".equals(successById.get(previousId))) {
                return BLOCKED;
            }
        }
        return "N".equals(successById.get(migrationId)) ? FAILED : PENDING;
    }
}