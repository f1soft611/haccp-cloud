package egovframework.let.uat.loginhistory.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import org.apache.commons.lang3.builder.ToStringBuilder;

import java.io.Serializable;

/**
 * 로그인 이력 관리를 위한 데이터 모델 클래스
 * @author SHMT-MES
 * @since 2026.01.08
 * @version 1.0
 * @see
 *
 * <pre>
 * << 개정이력(Modification Information) >>
 *
 *   수정일      수정자           수정내용
 *  -------    --------    ---------------------------
 *   2026.01.08 SHMT-MES          최초 생성
 *
 * </pre>
 */
@Schema(description = "로그인 이력 모델")
@Getter
@Setter
public class LoginHistory implements Serializable {

	/**
	 *  serialVersion UID
	 */
	private static final long serialVersionUID = 1L;

	@Schema(description = "로그인 이력 ID")
	private Long loginHistoryId;

	@Schema(description = "회사 코드")
	private String factoryCode = "000001";

	@Schema(description = "사용자 ID")
	private String userId;

	@Schema(description = "사용자 이름")
	private String userName;

	@Schema(description = "로그인 일시")
	private String loginDt;

	@Schema(description = "로그인 IP")
	private String loginIp;

	@Schema(description = "로그인 타입 (JWT/SESSION)")
	private String loginType;

	@Schema(description = "사용자 에이전트")
	private String userAgent;

	@Schema(description = "로그인 결과 (Y:성공, N:실패)")
	private String loginResult;

	@Schema(description = "실패 사유")
	private String failReason;

	@Schema(description = "로그아웃 일시")
	private String logoutDt;

	@Schema(description = "세션 유지 시간(분)")
	private Integer sessionTime;

	@Schema(description = "정부 인터페이스 전송 성공 여부 (Y/N)")
	private String govInterfaceYn;

	@Schema(description = "정부 인터페이스 마지막 전송 시각")
	private String govInterfaceDt;

	@Schema(description = "정부 인터페이스 수신 결과 코드")
	private String govRecptnRsltCd;

	@Schema(description = "정부 인터페이스 수신 결과 메시지")
	private String govRecptnRslt;

	@Schema(description = "정부 인터페이스 수신 결과 상세 메시지")
	private String govRecptnRsltDtl;

	@Schema(description = "정부 인터페이스 실패 사유")
	private String govFailReason;

	@Schema(description = "정부 인터페이스 요청 JSON")
	private String govRequestJson;

	@Schema(description = "정부 인터페이스 응답 JSON")
	private String govResponseJson;

	/**
	 * toString 메소드를 대치한다.
	 */
	public String toString(){
		return ToStringBuilder.reflectionToString(this);
	}
}
