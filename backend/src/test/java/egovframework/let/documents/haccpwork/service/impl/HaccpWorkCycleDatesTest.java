package egovframework.let.documents.haccpwork.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class HaccpWorkCycleDatesTest {

    // 2026-10-08 목요일
    private static final LocalDate TODAY = LocalDate.of(2026, 10, 8);

    @DisplayName("일주기와 발생시는 요청 일자가 기준일이다")
    @Test
    void resolve_dailyAndEventUseRequestedDate() {
        assertEquals(LocalDate.of(2026, 10, 2), HaccpWorkCycleDates.resolve("일", "2026-10-02", TODAY));
        assertEquals(LocalDate.of(2026, 10, 3), HaccpWorkCycleDates.resolve("발생시", "2026-10-03", TODAY));
    }

    @DisplayName("주주기는 그 주 월요일, 월주기는 그 달 1일이 기준일이다")
    @Test
    void resolve_weeklyMondayAndMonthlyFirstDay() {
        assertEquals(LocalDate.of(2026, 9, 28), HaccpWorkCycleDates.resolve("주", "2026-10-01", TODAY));
        assertEquals(LocalDate.of(2026, 9, 1), HaccpWorkCycleDates.resolve("월", "2026-09-17", TODAY));
    }

    @DisplayName("요청 일자가 없으면 오늘 기준 현재 주기다")
    @Test
    void resolve_emptyUsesToday() {
        assertEquals(LocalDate.of(2026, 10, 8), HaccpWorkCycleDates.resolve("일", null, TODAY));
        assertEquals(LocalDate.of(2026, 10, 5), HaccpWorkCycleDates.resolve("주", "", TODAY));
        assertEquals(LocalDate.of(2026, 10, 1), HaccpWorkCycleDates.resolve("월", "  ", TODAY));
    }

    @DisplayName("이번 주 남은 요일·이번 달 남은 날짜는 미래가 아니다")
    @Test
    void resolve_restOfCurrentCycleIsNotFuture() {
        assertEquals(LocalDate.of(2026, 10, 5), HaccpWorkCycleDates.resolve("주", "2026-10-11", TODAY));
        assertEquals(LocalDate.of(2026, 10, 1), HaccpWorkCycleDates.resolve("월", "2026-10-31", TODAY));
    }

    @DisplayName("미래 주기는 400 오류다")
    @Test
    void resolve_rejectsFutureCycle() {
        assertFuture("일", "2026-10-09");
        assertFuture("주", "2026-10-12");
        assertFuture("월", "2026-11-01");
    }

    @DisplayName("분기는 1, 4, 7, 10월 1일이 기준일이다")
    @Test
    void cycleStart_quarterFirstDay() {
        assertEquals(LocalDate.of(2026, 1, 1), HaccpWorkCycleDates.cycleStart("QUARTER", LocalDate.of(2026, 3, 31)));
        assertEquals(LocalDate.of(2026, 4, 1), HaccpWorkCycleDates.cycleStart("QUARTER", LocalDate.of(2026, 4, 1)));
        assertEquals(LocalDate.of(2026, 4, 1), HaccpWorkCycleDates.cycleStart("QUARTER", LocalDate.of(2026, 6, 30)));
        assertEquals(LocalDate.of(2026, 7, 1), HaccpWorkCycleDates.cycleStart("QUARTER", LocalDate.of(2026, 7, 1)));
        assertEquals(LocalDate.of(2026, 10, 1), HaccpWorkCycleDates.cycleStart("QUARTER", LocalDate.of(2026, 12, 31)));
    }

    @DisplayName("반기는 1월 1일, 7월 1일이 기준일이다")
    @Test
    void cycleStart_halfFirstDay() {
        assertEquals(LocalDate.of(2026, 1, 1), HaccpWorkCycleDates.cycleStart("HALF", LocalDate.of(2026, 6, 30)));
        assertEquals(LocalDate.of(2026, 7, 1), HaccpWorkCycleDates.cycleStart("HALF", LocalDate.of(2026, 7, 1)));
        assertEquals(LocalDate.of(2026, 7, 1), HaccpWorkCycleDates.cycleStart("HALF", LocalDate.of(2026, 12, 31)));
    }

    @DisplayName("연은 1월 1일이 기준일이다")
    @Test
    void cycleStart_yearFirstDay() {
        assertEquals(LocalDate.of(2026, 1, 1), HaccpWorkCycleDates.cycleStart("YEAR", LocalDate.of(2026, 12, 31)));
    }

    @DisplayName("요청 일자가 없으면 연, 반기, 분기도 오늘이 속한 주기 시작일로 저장된다")
    @Test
    void resolve_emptyUsesCurrentYearHalfQuarter() {
        assertEquals(LocalDate.of(2026, 1, 1), HaccpWorkCycleDates.resolve("YEAR", null, TODAY));
        assertEquals(LocalDate.of(2026, 7, 1), HaccpWorkCycleDates.resolve("HALF", "", TODAY));
        assertEquals(LocalDate.of(2026, 10, 1), HaccpWorkCycleDates.resolve("QUARTER", null, TODAY));
    }

    @DisplayName("다음 분기, 다음 반기, 다음 연도는 미래 주기다")
    @Test
    void resolve_rejectsFutureYearHalfQuarter() {
        assertFuture("QUARTER", "2027-01-01");
        assertFuture("HALF", "2027-01-01");
        assertFuture("YEAR", "2027-01-01");
    }

    @DisplayName("yyyy-MM-dd 형식이 아니면 400 오류다")
    @Test
    void resolve_rejectsInvalidFormat() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> HaccpWorkCycleDates.resolve("일", "20261002", TODAY));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getReason() != null && ex.getReason().contains("형식"));
    }

    private void assertFuture(String regTerm, String requestedDate) {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> HaccpWorkCycleDates.resolve(regTerm, requestedDate, TODAY));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getReason() != null && ex.getReason().contains("미래"));
    }
}