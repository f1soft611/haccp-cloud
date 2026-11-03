package egovframework.let.basicinfo.workday.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.util.Map;

import org.junit.jupiter.api.Test;

class PublicHolidayClientTest {

    private static String body(String items) {
        return "{\"response\":{\"header\":{\"resultCode\":\"00\",\"resultMsg\":\"NORMAL SERVICE.\"},"
                + "\"body\":{\"items\":" + items + ",\"numOfRows\":100,\"pageNo\":1,\"totalCount\":0}}}";
    }

    @Test
    void 배열_응답에서_공휴일만_읽고_겹친_날은_이름을_잇는다() throws Exception {
        Map<LocalDate, String> holidays = PublicHolidayClient.parseHolidays(body("{\"item\":["
                + "{\"dateName\":\"어린이날\",\"isHoliday\":\"Y\",\"locdate\":20250505},"
                + "{\"dateName\":\"부처님오신날\",\"isHoliday\":\"Y\",\"locdate\":20250505},"
                + "{\"dateName\":\"제헌절\",\"isHoliday\":\"N\",\"locdate\":20250717}]}"));
        assertEquals(1, holidays.size());
        assertEquals("어린이날, 부처님오신날", holidays.get(LocalDate.of(2025, 5, 5)));
    }

    @Test
    void 단건_객체와_빈_응답을_처리한다() throws Exception {
        Map<LocalDate, String> single = PublicHolidayClient.parseHolidays(
                body("{\"item\":{\"dateName\":\"성탄절\",\"isHoliday\":\"Y\",\"locdate\":20261225}}"));
        assertTrue(single.containsKey(LocalDate.of(2026, 12, 25)));

        assertFalse(PublicHolidayClient.parseHolidays(body("\"\"")).containsKey(LocalDate.of(2026, 1, 1)));
    }

    @Test
    void 오류_코드면_실패한다() {
        String error = "{\"response\":{\"header\":{\"resultCode\":\"30\",\"resultMsg\":\"SERVICE_KEY_IS_NOT_REGISTERED_ERROR\"}}}";
        assertThrows(IllegalStateException.class, () -> PublicHolidayClient.parseHolidays(error));
    }
}