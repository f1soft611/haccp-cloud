package egovframework.let.documents.haccpwork.service.impl;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.time.temporal.TemporalAdjusters;
import java.util.Arrays;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

public class HaccpWorkCycleDates {

    private static final List<String> MONTHLY = Arrays.asList("월", "매월", "month", "MONTH", "monthly", "MONTHLY");
    private static final List<String> WEEKLY = Arrays.asList("주", "매주", "week", "WEEK", "weekly", "WEEKLY");

    private HaccpWorkCycleDates() {
    }

    /** yyyy-MM-dd 문자열을 파싱한다. 비어 있으면 null, 형식 오류면 400. */
    static LocalDate parseOrNull(String requestedDate) {
        if (!StringUtils.hasText(requestedDate)) {
            return null;
        }
        try {
            return LocalDate.parse(requestedDate.trim());
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "주기 기준일 형식이 올바르지 않습니다.");
        }
    }

    static LocalDate cycleStart(String regTerm, LocalDate date) {
        String term = regTerm == null ? "" : regTerm.trim();
        if (MONTHLY.contains(term)) {
            return date.withDayOfMonth(1);
        }
        if (WEEKLY.contains(term)) {
            return date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        }
        return date;
    }

    /** 요청 일자(없으면 today)의 주기 기준일. 현재 주기보다 뒤면 400. */
    static LocalDate resolve(String regTerm, String requestedDate, LocalDate today) {
        LocalDate requested = parseOrNull(requestedDate);
        LocalDate cycleDate = cycleStart(regTerm, requested == null ? today : requested);
        if (cycleDate.isAfter(cycleStart(regTerm, today))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "미래 주기의 업무는 작성할 수 없습니다.");
        }
        return cycleDate;
    }
}