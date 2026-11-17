package egovframework.let.documents.haccpwork.service.impl;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.Arrays;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

public class HaccpWorkCycleDates {

    private static final List<String> MONTHLY = Arrays.asList("월", "매월", "month", "MONTH", "monthly", "MONTHLY");
    private static final List<String> WEEKLY = Arrays.asList("주", "매주", "week", "WEEK", "weekly", "WEEKLY");
    private static final List<String> ANYTIME = Arrays.asList("수시", "ANYTIME", "anytime");

    /** 주차 기준의 마지막 주 */
    public static final int LAST_WEEK = 9;

    private HaccpWorkCycleDates() {
    }

    /** 업무 주기 기준(업무 기준일 = 첫 주기 마감일, 반복 방식). 기준일이 없는 업무는 null 로 다룬다(기존 달력 기준). */
    public static final class Anchor {
        final LocalDate startDate;
        final boolean byWeekday;
        final int week;
        final int weekday;

        private Anchor(LocalDate startDate, boolean byWeekday, int week, int weekday) {
            this.startDate = startDate;
            this.byWeekday = byWeekday;
            this.week = week;
            this.weekday = weekday;
        }

        /** 업무 컬럼 값으로 기준을 만든다. 시작일이 비면 null */
        public static Anchor of(String startDate, String type, Integer week, Integer weekday) {
            if (!StringUtils.hasText(startDate)) {
                return null;
            }
            boolean byWeekday = "WEEKDAY".equals(type);
            return new Anchor(
                    LocalDate.parse(startDate.trim()),
                    byWeekday,
                    byWeekday && week != null ? week : 0,
                    byWeekday && weekday != null ? weekday : 0);
        }
    }

    /** reg_term(별칭 포함)을 DAY/WEEK/MONTH/QUARTER/HALF/YEAR/ANYTIME 으로 정규화 (SQL fn_work_cycle_code 와 같은 규칙) */
    public static String code(String regTerm) {
        String term = regTerm == null ? "" : regTerm.trim();
        if (MONTHLY.contains(term)) {
            return "MONTH";
        }
        if (WEEKLY.contains(term)) {
            return "WEEK";
        }
        if ("QUARTER".equals(term) || "HALF".equals(term) || "YEAR".equals(term)) {
            return term;
        }
        if (ANYTIME.contains(term)) {
            return "ANYTIME";
        }
        return "DAY";
    }

    /** 주기 개월 수 (MONTH 1, QUARTER 3, HALF 6, YEAR 12, 그 외 0) */
    private static int months(String code) {
        if ("MONTH".equals(code)) {
            return 1;
        }
        if ("QUARTER".equals(code)) {
            return 3;
        }
        if ("HALF".equals(code)) {
            return 6;
        }
        return "YEAR".equals(code) ? 12 : 0;
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
        if ("QUARTER".equals(term)) {
            return LocalDate.of(date.getYear(), (date.getMonthValue() - 1) / 3 * 3 + 1, 1);
        }
        if ("HALF".equals(term)) {
            return LocalDate.of(date.getYear(), date.getMonthValue() <= 6 ? 1 : 7, 1);
        }
        if ("YEAR".equals(term)) {
            return date.withDayOfYear(1);
        }
        return date;
    }

    /** date 가 속한 주기의 시작일. 기준이 없으면 기존 달력 기준, date 가 첫 주기 이전이면 null */
    static LocalDate cycleStart(String regTerm, Anchor anchor, LocalDate date) {
        if (anchor == null) {
            return cycleStart(regTerm, date);
        }
        if (date.isBefore(firstCycleStart(regTerm, anchor))) {
            return null;
        }
        String code = code(regTerm);
        if (!"WEEK".equals(code) && months(code) == 0) {
            return date;
        }
        return boundary(code, anchor, index(code, anchor, date));
    }

    /** date 가 속한 주기의 다음 주기 시작일 (주기 끝 = 이 값 - 1일). date 가 첫 주기 이전이면 null */
    static LocalDate nextCycleStart(String regTerm, Anchor anchor, LocalDate date) {
        String code = code(regTerm);
        if (anchor == null) {
            LocalDate start = cycleStart(regTerm, date);
            if ("WEEK".equals(code)) {
                return start.plusWeeks(1);
            }
            return months(code) == 0 ? start.plusDays(1) : start.plusMonths(months(code));
        }
        if (date.isBefore(firstCycleStart(regTerm, anchor))) {
            return null;
        }
        if (!"WEEK".equals(code) && months(code) == 0) {
            return date.plusDays(1);
        }
        return boundary(code, anchor, index(code, anchor, date) + 1);
    }

    /** ym 의 week째주(9 = 마지막 주) weekday 요일(1=월~7=일). 주는 목요일이 속한 달로 센다 (ISO, tb_week 와 같은 기준) */
    public static LocalDate monthWeekDate(YearMonth ym, int week, int weekday) {
        LocalDate thursday = week == LAST_WEEK
                ? ym.atEndOfMonth().with(TemporalAdjusters.previousOrSame(DayOfWeek.THURSDAY))
                : ym.atDay(1).with(TemporalAdjusters.nextOrSame(DayOfWeek.THURSDAY)).plusWeeks(week - 1L);
        return thursday.minusDays(3).plusDays(weekday - 1L);
    }

    /** 날짜가 속한 주(월~일)의 목요일이 있는 달 (주차 기준의 기준 달) */
    public static YearMonth anchorMonthOf(LocalDate date) {
        return YearMonth.from(date.with(DayOfWeek.MONDAY).plusDays(3));
    }

    /** 업무 기준일 기준 n번째 마감일. 월 단위는 매번 기준일에서 다시 더해 말일 보정이 누적되지 않게 한다 */
    private static LocalDate deadline(String code, Anchor anchor, long n) {
        if ("WEEK".equals(code)) {
            return anchor.startDate.plusWeeks(n);
        }
        long step = months(code) * n;
        if (anchor.byWeekday) {
            return monthWeekDate(anchorMonthOf(anchor.startDate).plusMonths(step), anchor.week, anchor.weekday);
        }
        return anchor.startDate.plusMonths(step);
    }

    /** n번째 주기 시작일 = (n-1)번째 마감일 다음 날 (기준일은 첫 주기의 마감일) */
    private static LocalDate boundary(String code, Anchor anchor, long n) {
        return deadline(code, anchor, n - 1).plusDays(1);
    }

    /** 첫 주기 시작일(작성 하한). 기준일에서 거꾸로 한 주기, 주기 칸이 없는 일, 수시는 기준일 그대로 */
    public static LocalDate firstCycleStart(String regTerm, Anchor anchor) {
        String code = code(regTerm);
        if (!"WEEK".equals(code) && months(code) == 0) {
            return anchor.startDate;
        }
        return boundary(code, anchor, 0);
    }

    /** date 가 속한 주기 번호(0부터). 주차 기준은 경계가 앞뒤 달로 넘어가므로 양쪽 모두 맞춘다 */
    private static long index(String code, Anchor anchor, LocalDate date) {
        if ("WEEK".equals(code)) {
            return ChronoUnit.DAYS.between(boundary(code, anchor, 0), date) / 7;
        }
        YearMonth base = anchor.byWeekday ? anchorMonthOf(anchor.startDate) : YearMonth.from(anchor.startDate);
        long n = Math.max(0L, Math.floorDiv(ChronoUnit.MONTHS.between(base, YearMonth.from(date)), (long) months(code)));
        while (n > 0 && boundary(code, anchor, n).isAfter(date)) {
            n--;
        }
        while (!boundary(code, anchor, n + 1).isAfter(date)) {
            n++;
        }
        return n;
    }

    /** 요청 일자(없으면 today)의 주기 기준일. 현재 주기보다 뒤면 400. */
    static LocalDate resolve(String regTerm, String requestedDate, LocalDate today) {
        return resolve(regTerm, null, requestedDate, today);
    }

    /** 업무 기준을 반영한 주기 기준일. 첫 주기 이전이면 400, 현재 주기보다 뒤면 400. */
    static LocalDate resolve(String regTerm, Anchor anchor, String requestedDate, LocalDate today) {
        LocalDate requested = parseOrNull(requestedDate);
        LocalDate target = requested == null ? today : requested;
        if (anchor != null && target.isBefore(firstCycleStart(regTerm, anchor))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "업무 기준일의 첫 주기 이전에는 작성할 수 없습니다.");
        }
        LocalDate cycleDate = cycleStart(regTerm, anchor, target);
        LocalDate currentCycleDate = cycleStart(regTerm, anchor, today);
        if (currentCycleDate == null || cycleDate.isAfter(currentCycleDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "미래 주기의 업무는 작성할 수 없습니다.");
        }
        return cycleDate;
    }
}