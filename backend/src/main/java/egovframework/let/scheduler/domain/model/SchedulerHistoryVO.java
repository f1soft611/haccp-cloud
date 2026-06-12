package egovframework.let.scheduler.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 스케쥴러 실행 이력 검색 조건 VO
 * @author SHMT-MES
 * @since 2025.10.23
 * @version 1.0
 * @see
 *
 * <pre>
 * << 개정이력(Modification Information) >>
 *
 *   수정일      수정자           수정내용
 *  -------    --------    ---------------------------
 *   2025.10.23 SHMT-MES          최초 생성
 *
 * </pre>
 */
@Schema(description = "스케쥴러 실행 이력 검색 조건 VO")
@Getter
@Setter
public class SchedulerHistoryVO extends SchedulerHistory {
	
	/**
	 *  serialVersion UID
	 */
	private static final long serialVersionUID = 1L;

	/** 검색조건 */
	@Schema(description = "검색 조건")
	private String searchCnd = "";
	
	/** 검색단어 */
	@Schema(description = "검색어")
	private String searchWrd = "";
	
	/** 페이지 번호 */
	@Schema(description = "페이지 번호")
	private int pageIndex = 1;
	
	/** 페이지 갯수 */
	@Schema(description = "페이지당 레코드 수")
	private int pageUnit = 10;
	
	/** 페이지 사이즈 */
	@Schema(description = "페이지 사이즈")
	private int pageSize = 10;

	/** 첫페이지 인덱스 */
	@Schema(description = "첫 페이지 인덱스")
	private int firstIndex = 1;

	/** 마지막페이지 인덱스 */
	@Schema(description = "마지막 페이지 인덱스")
	private int lastIndex = 1;

	/** 페이지당 레코드 개수 */
	@Schema(description = "레코드 개수")
	private int recordCountPerPage = 10;
}
