package egovframework.let.documents.workorder.service.impl;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import egovframework.let.documents.workorder.domain.model.WorkOrderSaveRequestVO;

class WorkOrderServiceImplTest {

    private static WorkOrderSaveRequestVO valid() {
        WorkOrderSaveRequestVO payload = new WorkOrderSaveRequestVO();
        payload.setMaterialId(1L);
        payload.setProdPlanDate("2026-10-15");
        payload.setExpirationDate("2027-10-15");
        payload.setProdplanQty(new BigDecimal("100"));
        payload.setProdMemo("");
        return payload;
    }

    private static String errorOf(WorkOrderSaveRequestVO payload) {
        return assertThrows(IllegalArgumentException.class,
                () -> WorkOrderServiceImpl.validate(payload)).getMessage();
    }

    @Test
    void 정상_입력은_통과한다() {
        assertDoesNotThrow(() -> WorkOrderServiceImpl.validate(valid()));
    }

    @Test
    void 품목_누락() {
        WorkOrderSaveRequestVO payload = valid();
        payload.setMaterialId(null);
        assertEquals("품목을 선택하세요.", errorOf(payload));
    }

    @Test
    void 생산계획일_누락() {
        WorkOrderSaveRequestVO payload = valid();
        payload.setProdPlanDate(" ");
        assertEquals("생산계획일을 입력하세요.", errorOf(payload));
    }

    @Test
    void 소비기한_누락() {
        WorkOrderSaveRequestVO payload = valid();
        payload.setExpirationDate(null);
        assertEquals("소비기한을 입력하세요.", errorOf(payload));
    }

    @Test
    void 날짜_형식_오류() {
        WorkOrderSaveRequestVO payload = valid();
        payload.setProdPlanDate("2026/10/15");
        assertEquals("날짜 형식이 올바르지 않습니다: 2026/10/15", errorOf(payload));
    }

    @Test
    void 소비기한이_생산계획일보다_빠르면_오류() {
        WorkOrderSaveRequestVO payload = valid();
        payload.setExpirationDate("2026-10-14");
        assertEquals("소비기한은 생산계획일 이후여야 합니다.", errorOf(payload));
    }

    @Test
    void 생산량_0이하_오류() {
        WorkOrderSaveRequestVO payload = valid();
        payload.setProdplanQty(BigDecimal.ZERO);
        assertEquals("생산량은 0보다 커야 합니다.", errorOf(payload));
    }

    @Test
    void 생산량_범위_초과() {
        WorkOrderSaveRequestVO payload = valid();
        payload.setProdplanQty(new BigDecimal("100000"));
        assertEquals("생산량은 99999.99999 이하로 입력하세요.", errorOf(payload));
    }

    @Test
    void 비고_255자_초과() {
        WorkOrderSaveRequestVO payload = valid();
        payload.setProdMemo(new String(new char[256]).replace('\0', 'a'));
        assertEquals("비고는 255자 이하로 입력하세요.", errorOf(payload));
    }

    @Test
    void 당일_첫_번호는_0001() {
        assertEquals("202610150001", WorkOrderServiceImpl.nextWorkdtNo("20261015", null));
    }

    @Test
    void 당일_최대번호_다음_순번() {
        assertEquals("202610150013", WorkOrderServiceImpl.nextWorkdtNo("20261015", "202610150012"));
    }

    @Test
    void 순번_9999_초과는_거부() {
        assertThrows(ResponseStatusException.class,
                () -> WorkOrderServiceImpl.nextWorkdtNo("20261015", "202610159999"));
    }
}
