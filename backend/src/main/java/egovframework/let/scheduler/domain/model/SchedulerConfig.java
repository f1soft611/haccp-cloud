package egovframework.let.scheduler.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import org.apache.commons.lang3.builder.ToStringBuilder;

import java.io.Serializable;

/**
 * 스케쥴러 설정 모델
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
@Schema(description = "스케쥴러 설정 모델")
@Getter
@Setter
public class SchedulerConfig implements Serializable {

	/**
	 *  serialVersion UID
	 */
	private static final long serialVersionUID = 1L;

	@Schema(description = "스케쥴러 ID")
	private Long schedulerId = null;

	@Schema(description = "스케쥴러 명")
	private String schedulerName = "";

	@Schema(description = "스케쥴러 설명")
	private String schedulerDescription = "";

	@Schema(description = "CRON 표현식")
	private String cronExpression = "";

	@Schema(description = "작업 클래스명")
	private String jobClassName = "";

	@Schema(description = "활성화 여부 (Y/N)")
	private String isEnabled = "";

	@Schema(description = "등록자 ID")
	private String regUserId = "";

	@Schema(description = "등록일시")
	private String regDt = "";

	@Schema(description = "수정자 ID")
	private String updUserId = "";

	@Schema(description = "수정일시")
	private String updDt = "";

	/**
	 * toString 메소드를 대치한다.
	 */
	public String toString(){
		return ToStringBuilder.reflectionToString(this);
	}
}
