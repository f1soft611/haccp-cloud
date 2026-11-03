package egovframework.let.basicinfo.workday.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

import egovframework.let.basicinfo.workday.domain.model.WeekVO;
import org.junit.jupiter.api.Test;

import egovframework.let.basicinfo.workday.domain.model.WorkdayVO;

class WorkdayServiceImplTest {

    private static final HashSet<Integer> SAT_SUN = new HashSet<Integer>(Arrays.asList(0, 6));

    private static WorkdayVO find(List<WorkdayVO> days, String date) {
        for (WorkdayVO day : days) {
            if (date.equals(day.getWorkdayDate())) {
                return day;
            }
        }
        throw new AssertionError("no row for " + date);
    }

    @Test
    void 연간_생성은_윤년이면_366일이다() {
        assertEquals(366, WorkdayServiceImpl.buildYear(2028, SAT_SUN, Collections.<LocalDate, String>emptyMap()).size());
        assertEquals(365, WorkdayServiceImpl.buildYear(2027, SAT_SUN, Collections.<LocalDate, String>emptyMap()).size());
    }

    @Test
    void 휴무요일은_회사휴일_평일은_근무일이다() {
        List<WorkdayVO> days = WorkdayServiceImpl.buildYear(2026, SAT_SUN, Collections.<LocalDate, String>emptyMap());
        // 2026-01-03 토, 2026-01-04 일, 2026-01-05 월
        assertEquals("COMPANY_HOLIDAY", find(days, "2026-01-03").getDayType());
        assertEquals("COMPANY_HOLIDAY", find(days, "2026-01-04").getDayType());
        WorkdayVO monday = find(days, "2026-01-05");
        assertEquals("WORK", monday.getDayType());
        assertEquals("PATTERN", monday.getSource());
        assertNull(monday.getDayName());
    }

    @Test
    void 공휴일이_휴무요일보다_우선하고_대체는_대체휴일이다() {
        Map<LocalDate, String> holidays = new HashMap<LocalDate, String>();
        holidays.put(LocalDate.of(2026, 3, 1), "삼일절");          // 일요일
        holidays.put(LocalDate.of(2026, 3, 2), "대체공휴일(삼일절)"); // 월요일
        List<WorkdayVO> days = WorkdayServiceImpl.buildYear(2026, SAT_SUN, holidays);

        WorkdayVO march1 = find(days, "2026-03-01");
        assertEquals("PUBLIC_HOLIDAY", march1.getDayType());
        assertEquals("API", march1.getSource());
        assertEquals("삼일절", march1.getDayName());
        assertEquals("SUBSTITUTE_HOLIDAY", find(days, "2026-03-02").getDayType());
    }

    @Test
    void 잘못된_유형이나_날짜는_거부한다() {
        WorkdayVO badType = new WorkdayVO();
        badType.setWorkdayDate("2026-01-05");
        badType.setDayType("HOLIDAY");
        assertThrows(IllegalArgumentException.class, () -> WorkdayServiceImpl.validateItem(badType));

        WorkdayVO badDate = new WorkdayVO();
        badDate.setWorkdayDate("2026-13-01");
        badDate.setDayType("WORK");
        assertThrows(IllegalArgumentException.class, () -> WorkdayServiceImpl.validateItem(badDate));
    }

    @Test
    void 휴일명과_메모는_100자까지만_허용한다() {
        StringBuilder longText = new StringBuilder();
        for (int i = 0; i < 101; i++) {
            longText.append('가');
        }
        WorkdayVO item = new WorkdayVO();
        item.setWorkdayDate("2026-01-05");
        item.setDayType("WORK");
        item.setMemo(longText.toString());
        assertThrows(IllegalArgumentException.class, () -> WorkdayServiceImpl.validateItem(item));
    }

    @Test
    void 연도와_요일_범위를_검증한다() {
        assertThrows(IllegalArgumentException.class,
                () -> WorkdayServiceImpl.validateGenerate(1999, Arrays.asList(0, 6)));
        assertThrows(IllegalArgumentException.class,
                () -> WorkdayServiceImpl.validateGenerate(2026, Arrays.asList(7)));
    }

    @Test
    void 주차는_ISO_8601_기준으로_만든다() {
        List<WeekVO> weeks2026 = WorkdayServiceImpl.buildWeeks(2026);
        assertEquals(53, weeks2026.size());
        WeekVO first = weeks2026.get(0);
        assertEquals(2026, first.getYear());
        assertEquals(1, first.getWeek());
        assertEquals("2025-12-29", first.getFromDate());
        assertEquals("2026-01-04", first.getToDate());
        WeekVO last = weeks2026.get(52);
        assertEquals(53, last.getWeek());
        assertEquals("2026-12-28", last.getFromDate());
        assertEquals("2027-01-03", last.getToDate());

        List<WeekVO> weeks2027 = WorkdayServiceImpl.buildWeeks(2027);
        assertEquals(52, weeks2027.size());
        assertEquals("2027-01-04", weeks2027.get(0).getFromDate());
        assertEquals("2027-01-10", weeks2027.get(0).getToDate());
    }

    @Test
    void 주차_조회_기간을_검증한다() {
        assertThrows(IllegalArgumentException.class,
                () -> WorkdayServiceImpl.validateWeekRange("2026-02-01", "2026-01-01"));
        assertThrows(IllegalArgumentException.class,
                () -> WorkdayServiceImpl.validateWeekRange("2026-13-01", "2026-12-31"));
        assertThrows(IllegalArgumentException.class,
                () -> WorkdayServiceImpl.validateWeekRange(null, "2026-12-31"));
        assertDoesNotThrow(() -> WorkdayServiceImpl.validateWeekRange("2026-12-01", "2028-01-31"));
    }
}