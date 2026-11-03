package egovframework.let.basicinfo.workday.service.impl;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * 한국천문연구원 특일정보(공휴일) API 호출 클래스
 * @author SHMT-MES
 * @since 2026.11.03
 * @version 1.0
 */
@Component("publicHolidayClient")
public class PublicHolidayClient {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    static final String FETCH_FAILED = "공휴일 정보를 가져오지 못했습니다.";

    @Value("${holiday.api.url:https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo}")
    private String apiUrl;

    @Value("${holiday.api.service-key:}")
    private String serviceKey;

    @Value("${holiday.api.timeout-ms:5000}")
    private int timeoutMs;

    public Map<LocalDate, String> fetchHolidays(int year) {
        if (!StringUtils.hasText(serviceKey)) {
            throw new IllegalStateException(FETCH_FAILED + " (holiday.api.service-key 미설정)");
        }
        try {
            URL url = new URL(apiUrl
                    + "?serviceKey=" + URLEncoder.encode(serviceKey.trim(), "UTF-8")
                    + "&solYear=" + year
                    + "&numOfRows=100&_type=json");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(timeoutMs);
            connection.setReadTimeout(timeoutMs);
            connection.setRequestProperty("Accept", "application/json");

            int status = connection.getResponseCode();
            if (status < 200 || status >= 300) {
                throw new IllegalStateException(FETCH_FAILED + " (HTTP " + status + ")");
            }
            try (InputStream in = connection.getInputStream()) {
                return parseHolidays(readAll(in));
            }
        } catch (IllegalStateException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalStateException(FETCH_FAILED, ex);
        }
    }

    static Map<LocalDate, String> parseHolidays(String responseBody) throws Exception {
        JsonNode response = OBJECT_MAPPER.readTree(responseBody).path("response");
        String resultCode = response.path("header").path("resultCode").asText();
        if (!"00".equals(resultCode)) {
            throw new IllegalStateException(FETCH_FAILED + " (" + response.path("header").path("resultMsg").asText(resultCode) + ")");
        }

        // 0건이면 items 가 "" 문자열, 1건이면 item 이 객체로 온다
        JsonNode item = response.path("body").path("items").path("item");
        if (item.isMissingNode() || item.isNull()) {
            return Collections.emptyMap();
        }
        Map<LocalDate, String> holidays = new LinkedHashMap<LocalDate, String>();
        Iterable<JsonNode> rows = item.isArray() ? item : Collections.singletonList(item);
        for (JsonNode row : rows) {
            if (!"Y".equals(row.path("isHoliday").asText())) {
                continue;
            }
            LocalDate date = LocalDate.parse(row.path("locdate").asText(), DateTimeFormatter.BASIC_ISO_DATE);
            String name = row.path("dateName").asText().trim();
            holidays.merge(date, name, (before, added) -> before + ", " + added);
        }
        return holidays;
    }

    private static String readAll(InputStream in) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buffer = new byte[4096];
        int read;
        while ((read = in.read(buffer)) != -1) {
            out.write(buffer, 0, read);
        }
        return new String(out.toByteArray(), StandardCharsets.UTF_8);
    }
}