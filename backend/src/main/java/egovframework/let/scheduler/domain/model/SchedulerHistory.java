package egovframework.let.scheduler.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import org.apache.commons.lang3.builder.ToStringBuilder;

import java.io.PrintWriter;
import java.io.Serializable;
import java.io.StringWriter;

@Schema(description = "스케쥴러 실행 이력 모델")
@Getter
@Setter
public class SchedulerHistory implements Serializable {

	private static final long serialVersionUID = 1L;

	@Schema(description = "이력 ID")
	private Long historyId = null;

	@Schema(description = "스케쥴러 ID")
	private Long schedulerId = null;

	@Schema(description = "스케쥴러 명")
	private String schedulerName = "";

	@Schema(description = "시작시간")
	private String startTime = "";

	@Schema(description = "종료시간")
	private String endTime = "";

	@Schema(description = "실행상태 (SUCCESS/FAILED/RUNNING)")
	private String status = "";

	@Schema(description = "에러 메시지")
	private String errorMessage = "";

	@Schema(description = "에러 스택트레이스")
	private String errorStackTrace = "";

	@Schema(description = "실행시간(밀리초)")
	private Long executionTimeMs = null;

	@Schema(description = "등록일시")
	private String regDt = "";

	@Schema(description = "재시도 횟수")
	private Integer retryCount = 0;

	/**
	 * Exception을 기반으로 에러 정보를 설정
	 * ✅ 개선: getMessage()가 null인 경우 처리
	 */
	public void setErrorFromException(Exception e) {
		if (e == null) {
			this.errorMessage = "Unknown Error";
			this.errorStackTrace = "";
			return;
		}

		// ✅ 1. 에러 메시지 추출 (null 안전)
		this.errorMessage = extractErrorMessage(e);

		// ✅ 2. 스택트레이스를 문자열로 변환
		try {
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			e.printStackTrace(pw);
			String stackTrace = sw.toString();

			// DB 컬럼 크기 제한 고려 (8000자)
			if (stackTrace.length() > 8000) {
				this.errorStackTrace = stackTrace.substring(0, 7997) + "...";
			} else {
				this.errorStackTrace = stackTrace;
			}
		} catch (Exception ex) {
			this.errorStackTrace = "Stack trace extraction failed: " + ex.getMessage();
		}
	}

	/**
	 * ✅ 예외에서 의미있는 메시지를 추출
	 * getMessage()가 null이어도 안전하게 처리
	 */
	private String extractErrorMessage(Exception e) {
		StringBuilder message = new StringBuilder();

		// 1. 예외 타입 추가
		message.append("[").append(e.getClass().getSimpleName()).append("] ");

		// 2. 메시지 추출
		String exceptionMessage = e.getMessage();
		if (exceptionMessage != null && !exceptionMessage.trim().isEmpty()) {
			message.append(exceptionMessage);
		} else {
			// getMessage()가 null인 경우 대체 정보
			message.append("(메시지 없음)");

			// Cause에서 메시지 찾기
			Throwable cause = e.getCause();
			if (cause != null && cause.getMessage() != null) {
				message.append(" - Cause: ").append(cause.getMessage());
			}
		}

		// 3. 원인 예외 체인 추가 (최대 3단계)
		Throwable cause = e.getCause();
		int depth = 0;
		while (cause != null && depth < 3) {
			message.append(" → [").append(cause.getClass().getSimpleName()).append("] ");

			String causeMessage = cause.getMessage();
			if (causeMessage != null && !causeMessage.trim().isEmpty()) {
				// 너무 길면 잘라내기
				if (causeMessage.length() > 200) {
					message.append(causeMessage.substring(0, 197)).append("...");
				} else {
					message.append(causeMessage);
				}
			} else {
				message.append("(메시지 없음)");
			}

			cause = cause.getCause();
			depth++;
		}

		String result = message.toString();

		// 4. 최종 길이 제한 (DB 컬럼 크기 고려, 보통 1000~2000)
		if (result.length() > 2000) {
			return result.substring(0, 1997) + "...";
		}

		return result;
	}

	@Override
	public String toString() {
		return ToStringBuilder.reflectionToString(this);
	}
}