package egovframework.let.basicinfo.materials.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.Map;

import org.junit.jupiter.api.Test;

import egovframework.let.basicinfo.materials.domain.model.MaterialSaveRequestVO;

class MaterialServiceImplTest {

    private static MaterialSaveRequestVO payload(String expiryedStatus, Integer expiryedCount) {
        MaterialSaveRequestVO payload = new MaterialSaveRequestVO();
        payload.setMaterialName("밀가루");
        payload.setExpiryedStatus(expiryedStatus);
        payload.setExpiryedCount(expiryedCount);
        return payload;
    }

    private static String errorOf(MaterialSaveRequestVO payload) {
        return assertThrows(IllegalArgumentException.class, () -> MaterialServiceImpl.buildParams(payload)).getMessage();
    }

    @Test
    void 소비기한_기준이_비어있으면_NONE으로_저장하고_숫자는_비운다() {
        Map<String, Object> params = MaterialServiceImpl.buildParams(payload(" ", 5));
        assertEquals("NONE", params.get("expiryedStatus"));
        assertNull(params.get("expiryedCount"));
    }

    @Test
    void 소비기한_기준이_NONE이면_숫자는_비운다() {
        Map<String, Object> params = MaterialServiceImpl.buildParams(payload("NONE", 5));
        assertEquals("NONE", params.get("expiryedStatus"));
        assertNull(params.get("expiryedCount"));
    }

    @Test
    void 소비기한_기준과_숫자를_함께_저장한다() {
        Map<String, Object> params = MaterialServiceImpl.buildParams(payload("MONTH", 12));
        assertEquals("MONTH", params.get("expiryedStatus"));
        assertEquals(12, params.get("expiryedCount"));
    }

    @Test
    void 허용되지_않은_소비기한_기준() {
        assertEquals("소비기한 기준이 올바르지 않습니다.", errorOf(payload("WEEK", 1)));
    }

    @Test
    void 소비기한_기준이_있으면_숫자는_필수() {
        assertEquals("소비기한 계산숫자는 1 이상이어야 합니다.", errorOf(payload("DAY", null)));
    }

    @Test
    void 소비기한_숫자는_1_이상() {
        assertEquals("소비기한 계산숫자는 1 이상이어야 합니다.", errorOf(payload("DAY", 0)));
    }

    @Test
    void 문자열_항목은_공백을_정리한다() {
        MaterialSaveRequestVO payload = payload(null, null);
        payload.setMaterialKind(" FOOD ");
        payload.setStoreMethod(" ");
        payload.setKfdaReportNo(" 2026-0001 ");
        Map<String, Object> params = MaterialServiceImpl.buildParams(payload);
        assertEquals("FOOD", params.get("materialKind"));
        assertNull(params.get("storeMethod"));
        assertEquals("2026-0001", params.get("kfdaReportNo"));
    }

    @Test
    void 품목보고번호는_20자_이하() {
        MaterialSaveRequestVO payload = payload(null, null);
        payload.setKfdaReportNo("123456789012345678901");
        assertEquals("품목보고번호는 20자 이하여야 합니다.", errorOf(payload));
    }
}