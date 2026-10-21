package egovframework.let.basicinfo.equipment.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.Map;

import org.junit.jupiter.api.Test;

import egovframework.let.basicinfo.equipment.domain.model.EquipmentSaveRequestVO;

class EquipmentServiceImplTest {

    private static EquipmentSaveRequestVO payload(String vcKind, Integer vcCycle) {
        EquipmentSaveRequestVO payload = new EquipmentSaveRequestVO();
        payload.setEquipCd("EQ-01");
        payload.setEquipNm("온도계");
        payload.setVcKind(vcKind);
        payload.setVcCycle(vcCycle);
        return payload;
    }

    @Test
    void 검교정구분과_주기를_함께_저장한다() {
        Map<String, Object> params = EquipmentServiceImpl.buildParams(payload(" ACCREDITED ", 12));
        assertEquals("ACCREDITED", params.get("vcKind"));
        assertEquals(12, params.get("vcCycle"));
    }

    @Test
    void 검교정구분과_주기는_비워도_된다() {
        Map<String, Object> params = EquipmentServiceImpl.buildParams(payload(" ", null));
        assertNull(params.get("vcKind"));
        assertNull(params.get("vcCycle"));
    }

    @Test
    void 검교정주기는_1_이상() {
        String message = assertThrows(IllegalArgumentException.class,
                () -> EquipmentServiceImpl.buildParams(payload(null, 0))).getMessage();
        assertEquals("검교정 주기는 1 이상이어야 합니다.", message);
    }

    @Test
    void 관리코드는_000001부터_6자리로_채번한다() {
        assertEquals("000001", EquipmentServiceImpl.generateNextEquipSysCd(null));
        assertEquals("000001", EquipmentServiceImpl.generateNextEquipSysCd(""));
        assertEquals("000001", EquipmentServiceImpl.generateNextEquipSysCd("000000"));
        assertEquals("000002", EquipmentServiceImpl.generateNextEquipSysCd("000001"));
        assertEquals("000010", EquipmentServiceImpl.generateNextEquipSysCd("000009"));
    }
}