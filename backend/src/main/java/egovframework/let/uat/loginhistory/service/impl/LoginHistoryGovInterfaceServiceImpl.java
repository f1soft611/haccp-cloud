package egovframework.let.uat.loginhistory.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import egovframework.let.uat.loginhistory.domain.model.LoginHistory;
import egovframework.let.uat.loginhistory.service.LoginHistoryGovInterfaceService;
import egovframework.let.uat.loginhistory.service.LoginHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 로그인 이력 정부 로그 API(JSON) 전송 서비스
 */
@Slf4j
@Service("loginHistoryGovInterfaceService")
@RequiredArgsConstructor
public class LoginHistoryGovInterfaceServiceImpl implements LoginHistoryGovInterfaceService {

	private final LoginHistoryService loginHistoryService;
	private final ObjectMapper objectMapper;

	@Value("${gov.log.api.url:https://log.smart-factory.kr/apisvc/sendLogData.json}")
	private String govLogApiUrl;

	@Value("${gov.log.api.crtfcKey:}")
	private String crtfcKey;

	@Value("${gov.log.api.useSe:접속}")
	private String useSe;

	@Value("${gov.log.api.connect-timeout-ms:5000}")
	private int connectTimeoutMs;

	@Value("${gov.log.api.read-timeout-ms:10000}")
	private int readTimeoutMs;

	@Override
	@Transactional
	public void executeInterface(String fromDate, String toDate) throws Exception {
		String normalizedFromDate = normalizeDate(fromDate);
		String normalizedToDate = normalizeDate(toDate);

		LoginHistory target = loginHistoryService.selectLatestLoginHistoryForGovInterface(normalizedFromDate, normalizedToDate);
		if (target == null) {
			log.info("정부 로그인 이력 전송 대상이 없습니다. (기간: {} ~ {})", normalizedFromDate, normalizedToDate);
			return;
		}

		Map<String, Object> payload = buildPayload(target);
		String requestJson = objectMapper.writeValueAsString(payload);

		if (crtfcKey == null || crtfcKey.trim().isEmpty()) {
			target.setGovInterfaceYn("N");
			target.setGovFailReason("정부 로그 API 인증키가 설정되지 않았습니다.");
			target.setGovRequestJson(requestJson);
			target.setGovResponseJson(null);
			target.setGovRecptnRsltCd("AP1011");
			target.setGovRecptnRslt("기타 오류 (API 인증키 데이터 없음)");
			target.setGovRecptnRsltDtl("gov.log.api.crtfcKey 미설정");
			loginHistoryService.updateGovInterfaceResult(target);
			log.warn("정부 로그인 이력 전송 실패 - 인증키 미설정, loginHistoryId={}", target.getLoginHistoryId());
			throw new IllegalStateException("gov.log.api.crtfcKey 미설정");
		}

		try {
			HttpCallResult callResult = callGovLogApi(requestJson);
			GovResult govResult = extractGovResult(callResult.responseBody);

			target.setGovRecptnRsltCd(govResult.recptnRsltCd);
			target.setGovRecptnRslt(govResult.recptnRslt);
			target.setGovRecptnRsltDtl(govResult.recptnRsltDtl);
			target.setGovRequestJson(requestJson);
			target.setGovResponseJson(callResult.responseBody);

			if (GovLogResponseCodeEvaluator.isSuccessCode(govResult.recptnRsltCd)) {
				target.setGovInterfaceYn("Y");
				target.setGovFailReason(null);
				log.info("정부 로그인 이력 전송 성공 - loginHistoryId={}, code={}",
						target.getLoginHistoryId(), govResult.recptnRsltCd);
			} else {
				target.setGovInterfaceYn("N");
				target.setGovFailReason(buildFailReason(callResult.httpStatus, govResult));
				log.warn("정부 로그인 이력 전송 실패 - loginHistoryId={}, httpStatus={}, code={}",
						target.getLoginHistoryId(), callResult.httpStatus, govResult.recptnRsltCd);
			}

			loginHistoryService.updateGovInterfaceResult(target);

			if (!GovLogResponseCodeEvaluator.isSuccessCode(govResult.recptnRsltCd)) {
				throw new RuntimeException("정부 로그인 이력 전송 실패: " + target.getGovFailReason());
			}
		} catch (RuntimeException e) {
			throw e;
		} catch (Exception e) {
			target.setGovInterfaceYn("N");
			target.setGovRecptnRsltCd("AP1010");
			target.setGovRecptnRslt("기타 오류");
			target.setGovRecptnRsltDtl(e.getMessage());
			target.setGovFailReason(e.getMessage());
			target.setGovRequestJson(requestJson);
			target.setGovResponseJson(null);

			loginHistoryService.updateGovInterfaceResult(target);
			log.error("정부 로그인 이력 전송 중 예외 발생 - loginHistoryId={}", target.getLoginHistoryId(), e);
			throw e;
		}
	}

	private Map<String, Object> buildPayload(LoginHistory loginHistory) {
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("crtfcKey", crtfcKey);
		payload.put("logDt", formatLogDate(loginHistory.getLoginDt()));
		payload.put("useSe", useSe);
		payload.put("sysUser", buildSysUser(loginHistory));
		payload.put("conectIp", loginHistory.getLoginIp());
		payload.put("dataUsgqty", 0);
		return payload;
	}

	private String normalizeDate(String dateValue) {
		if (dateValue != null && !dateValue.trim().isEmpty()) {
			return dateValue.trim();
		}
		return LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
	}

	private String formatLogDate(String loginDt) {
		if (loginDt != null && !loginDt.trim().isEmpty()) {
			String normalized = loginDt.trim();
			if (normalized.length() == 19) {
				return normalized + ".000";
			}
			return normalized;
		}
		return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS").format(new Date());
	}

	private String buildSysUser(LoginHistory loginHistory) {
		String userId = loginHistory.getUserId() == null ? "" : loginHistory.getUserId();
		String userName = loginHistory.getUserName() == null ? "" : loginHistory.getUserName();

		if (userName.trim().isEmpty()) {
			return userId;
		}
		return userId + "(" + userName + ")";
	}

	private HttpCallResult callGovLogApi(String requestJson) throws Exception {
		URL url = new URL(govLogApiUrl);
		HttpURLConnection connection = (HttpURLConnection) url.openConnection();
		connection.setRequestMethod("POST");
		connection.setConnectTimeout(connectTimeoutMs);
		connection.setReadTimeout(readTimeoutMs);
		connection.setDoOutput(true);
		connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
		connection.setRequestProperty("Accept", "application/json");

		try (OutputStream outputStream = connection.getOutputStream()) {
			outputStream.write(requestJson.getBytes(StandardCharsets.UTF_8));
			outputStream.flush();
		}

		int httpStatus = connection.getResponseCode();
		InputStream responseStream = httpStatus >= 200 && httpStatus < 400
				? connection.getInputStream()
				: connection.getErrorStream();
		String responseBody = readStream(responseStream);

		HttpCallResult result = new HttpCallResult();
		result.httpStatus = httpStatus;
		result.responseBody = responseBody;
		return result;
	}

	private GovResult extractGovResult(String responseBody) {
		GovResult result = new GovResult();
		if (responseBody == null || responseBody.trim().isEmpty()) {
			return result;
		}

		try {
			JsonNode root = objectMapper.readTree(responseBody);
			JsonNode targetNode = root.has("result") ? root.get("result") : root;

			result.recptnRsltCd = asText(targetNode, "recptnRsltCd");
			result.recptnRslt = asText(targetNode, "recptnRslt");
			result.recptnRsltDtl = asText(targetNode, "recptnRsltDtl");
		} catch (Exception e) {
			result.recptnRsltCd = "AP1010";
			result.recptnRslt = "응답 JSON 파싱 실패";
			result.recptnRsltDtl = e.getMessage();
		}

		return result;
	}

	private String asText(JsonNode node, String fieldName) {
		if (node == null || !node.has(fieldName) || node.get(fieldName).isNull()) {
			return null;
		}
		return node.get(fieldName).asText();
	}

	private String readStream(InputStream inputStream) throws Exception {
		if (inputStream == null) {
			return "";
		}

		StringBuilder response = new StringBuilder();
		try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
			String line;
			while ((line = reader.readLine()) != null) {
				response.append(line);
			}
		}
		return response.toString();
	}

	private String buildFailReason(int httpStatus, GovResult govResult) {
		String code = govResult.recptnRsltCd == null ? "-" : govResult.recptnRsltCd;
		String message = govResult.recptnRslt == null ? "" : govResult.recptnRslt;
		String detail = govResult.recptnRsltDtl == null ? "" : govResult.recptnRsltDtl;
		return "HTTP " + httpStatus + ", code=" + code + ", message=" + message + ", detail=" + detail;
	}

	private static class HttpCallResult {
		private int httpStatus;
		private String responseBody;
	}

	private static class GovResult {
		private String recptnRsltCd;
		private String recptnRslt;
		private String recptnRsltDtl;
	}
}
