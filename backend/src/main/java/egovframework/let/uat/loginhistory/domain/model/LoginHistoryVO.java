package egovframework.let.uat.loginhistory.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 로그인 이력 검색 VO 클래스
 * @author SHMT-MES
 * @since 2026.01.08
 * @version 1.0
 * @see
 */
@Schema(description = "로그인 이력 검색 VO")
@Getter
@Setter
public class LoginHistoryVO extends LoginHistory {

	/**
	 *  serialVersion UID
	 */
	private static final long serialVersionUID = 1L;

	@Schema(description = "검색 시작 일자")
	private String searchStartDt;

	@Schema(description = "검색 종료 일자")
	private String searchEndDt;

	@Schema(description = "검색 사용자 ID")
	private String searchUserId;

	@Schema(description = "검색 사용자 이름")
	private String searchUserName;

	@Schema(description = "검색 로그인 결과")
	private String searchLoginResult;

	@Schema(description = "페이지 번호")
	private int pageIndex = 1;

	@Schema(description = "페이지 크기")
	private int pageSize = 10;

	@Schema(description = "페이지 단위")
	private int pageUnit = 10;

	@Schema(description = "첫 페이지 인덱스")
	private int firstIndex = 0;

	@Schema(description = "마지막 페이지 인덱스")
	private int lastIndex = 0;

	@Schema(description = "레코드 카운트 per 페이지")
	private int recordCountPerPage = 10;
}
