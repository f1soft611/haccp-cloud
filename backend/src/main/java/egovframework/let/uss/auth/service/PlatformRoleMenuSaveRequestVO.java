package egovframework.let.uss.auth.service;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 권한별 메뉴 저장 요청 VO
 */
@Schema(description = "플랫폼 권한별 메뉴 저장 요청 VO")
@Getter
@Setter
public class PlatformRoleMenuSaveRequestVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "권한 코드")
    private String roleCode = "";

    @Schema(description = "메뉴 ID 목록")
    private List<String> menuIds = new ArrayList<>();

    /**
     * 요청 payload를 정규화한다.
     * - roleCode/menuIds를 대문자로 변환
     * - menuIds 중복 제거(입력 순서 유지)
     */
    public void normalize() {
        this.roleCode = normalizeUpper(this.roleCode);

        Set<String> deduplicated = new LinkedHashSet<>();
        if (this.menuIds != null) {
            for (String menuId : this.menuIds) {
                String normalized = normalizeUpper(menuId);
                if (!normalized.isEmpty()) {
                    deduplicated.add(normalized);
                }
            }
        }

        this.menuIds = new ArrayList<>(deduplicated);
    }

    private String normalizeUpper(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toUpperCase();
    }
}