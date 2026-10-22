package egovframework.let.documents.haccpwork.service.impl;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDateTime;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import egovframework.let.documents.haccpwork.domain.model.HaccpWorkApprovalSubVO;

public class HaccpWorkApprovalSubsTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 10, 22, 9, 0);

    private HaccpWorkApprovalSubVO sub(Long equipmentId, String materialType, Long userId, String inspected, String expiration) {
        HaccpWorkApprovalSubVO sub = new HaccpWorkApprovalSubVO();
        sub.setEquipmentId(equipmentId);
        sub.setMaterialType(materialType);
        sub.setCertificationUserId(userId);
        sub.setInspectedDate(inspected);
        sub.setExpirationDate(expiration);
        return sub;
    }

    @DisplayName("4개 HCP 분류코드만 sub 대상이다")
    @Test
    void isSubCategory_onlyFourHcpCodes() {
        assertTrue(HaccpWorkApprovalSubs.isSubCategory("HCP-CALIB"));
        assertTrue(HaccpWorkApprovalSubs.isSubCategory("HCP-VALID"));
        assertTrue(HaccpWorkApprovalSubs.isSubCategory("HCP-SQI"));
        assertTrue(HaccpWorkApprovalSubs.isSubCategory(" HCP-HCERT "));
        assertFalse(HaccpWorkApprovalSubs.isSubCategory("HCP-ETC"));
        assertFalse(HaccpWorkApprovalSubs.isSubCategory("HA"));
        assertFalse(HaccpWorkApprovalSubs.isSubCategory(null));
    }

    @DisplayName("sub 가 없거나 대상, 날짜가 비어 있으면 필수값 400")
    @Test
    void validate_rejectsMissingValues() {
        ResponseStatusException noSub = assertThrows(ResponseStatusException.class,
                () -> HaccpWorkApprovalSubs.validate("HCP-CALIB", null));
        assertEquals(HttpStatus.BAD_REQUEST, noSub.getStatus());
        assertEquals("필수값을 입력하세요.", noSub.getReason());

        assertThrows(ResponseStatusException.class,
                () -> HaccpWorkApprovalSubs.validate("HCP-CALIB", sub(null, "RAW", null, "2026-10-01", "2027-10-01")));
        assertThrows(ResponseStatusException.class,
                () -> HaccpWorkApprovalSubs.validate("HCP-VALID", sub(501L, " ", null, "2026-10-01", "2027-10-01")));
        assertThrows(ResponseStatusException.class,
                () -> HaccpWorkApprovalSubs.validate("HCP-HCERT", sub(null, null, 7L, "", "2027-10-01")));
    }

    @DisplayName("날짜 형식이 틀리면 400")
    @Test
    void validate_rejectsBadDateFormat() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> HaccpWorkApprovalSubs.validate("HCP-CALIB", sub(501L, null, null, "2026/10/01", "2027-10-01")));
        assertEquals("날짜 형식이 올바르지 않습니다.", ex.getReason());
    }

    @DisplayName("검사일이 만료일보다 늦으면 400")
    @Test
    void validate_rejectsInspectedAfterExpiration() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> HaccpWorkApprovalSubs.validate("HCP-SQI", sub(null, "RAW", null, "2027-10-02", "2027-10-01")));
        assertEquals("만료일은 검사일 이후여야 합니다.", ex.getReason());
    }

    @DisplayName("필수값이 모두 있으면 통과한다 (같은 날짜 허용)")
    @Test
    void validate_passes() {
        assertDoesNotThrow(() -> HaccpWorkApprovalSubs.validate("HCP-HCERT", sub(null, null, 7L, "2026-10-01", "2026-10-01")));
    }

    @DisplayName("저장 파라미터는 분류코드의 대상 컬럼만 채우고 날짜를 yyyyMMdd 로 바꾼다")
    @Test
    void toParams_keepsOnlyCategoryTarget() {
        Map<String, Object> calib = HaccpWorkApprovalSubs.toParams(
                10L, 77L, 5L, "HCP-CALIB", sub(501L, "RAW", 7L, "2026-10-01", "2027-10-01"), 3001L, NOW);
        assertEquals(10L, calib.get("tenantId"));
        assertEquals(77L, calib.get("approvalId"));
        assertEquals(5L, calib.get("workId"));
        assertEquals(501L, calib.get("equipmentId"));
        assertNull(calib.get("materialType"));
        assertNull(calib.get("certificationUserId"));
        assertEquals("20261001", calib.get("inspectedDate"));
        assertEquals("20271001", calib.get("expirationDate"));
        assertEquals(3001L, calib.get("actorLoginId"));
        assertEquals(NOW, calib.get("now"));

        Map<String, Object> valid = HaccpWorkApprovalSubs.toParams(
                10L, 77L, 5L, "HCP-VALID", sub(501L, " RAW ", 7L, "2026-10-01", "2027-10-01"), 3001L, NOW);
        assertNull(valid.get("equipmentId"));
        assertEquals("RAW", valid.get("materialType"));
        assertNull(valid.get("certificationUserId"));

        Map<String, Object> hcert = HaccpWorkApprovalSubs.toParams(
                10L, 77L, 5L, "HCP-HCERT", sub(501L, "RAW", 7L, "2026-10-01", "2027-10-01"), 3001L, NOW);
        assertNull(hcert.get("equipmentId"));
        assertNull(hcert.get("materialType"));
        assertEquals(7L, hcert.get("certificationUserId"));
    }
}