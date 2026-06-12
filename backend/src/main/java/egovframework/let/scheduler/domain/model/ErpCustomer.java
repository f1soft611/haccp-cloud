package egovframework.let.scheduler.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * ERP 거래처 정보 DTO
 * ERP의 SHM_IF_VIEW_TDACust 뷰 테이블 구조에 매핑되는 도메인 모델
 *
 * @author SHMT-MES
 * @since 2025.11.14
 * @version 1.0
 */
@Data
public class ErpCustomer implements Serializable {
	private static final long serialVersionUID = 1L;

	/**
	 * 회사코드 (FactoryCode)
	 */
	private String factoryCode = "000001";

	/**
	 * 법인코드 (CompanySeq)
	 */
	private Integer companySeq;

	/**
	 * 거래처코드 (CustSeq)
	 */
	private Integer custSeq;

	/**
	 * 거래처명 (CustName) - nvarchar(100)
	 */
	private String custName;

	/**
	 * 거래처상태코드 (SMCustStatus)
	 */
	private Integer smCustStatus;

	/**
	 * 거래처상태명 ex) 정상, 휴업, 폐업 등 (SMCustStatusName) - nvarchar(100)
	 */
	private String smCustStatusName;

	/**
	 * 국내외구분코드 (SMDomFor)
	 */
	private Integer smDomFor;

	/**
	 * 국내외구분명 ex) 국내, 국외 (SMDomForName) - nvarchar(100)
	 */
	private String smDomForName;

	/**
	 * 사업자번호 (BizNo) - nvarchar(40)
	 */
	private String bizNo;

	/**
	 * 세무사업자주소 (BizAddr) - nvarchar(500)
	 */
	private String bizAddr;

	/**
	 * 유통구조코드 (UMChannelSeq)
	 */
	private Integer umChannelSeq;

	/**
	 * 유통구조명 (UMChannelName) - nvarchar(100)
	 */
	private String umChannelName;

	/**
	 * 주소/담당자정보 우편번호 (ZipCode) - nvarchar(10)
	 */
	private String zipCode;

	/**
	 * 거래처종류코드 (CustKindSeq)
	 */
	private Integer custKindSeq;

	/**
	 * 거래처종류명 (CustKindName) - nvarchar(100)
	 */
	private String custKindName;

	/**
	 * 최종수정자내부코드 (LastUserSeq)
	 */
	private Integer lastUserSeq;

	/**
	 * 최종수정일시 (LastDateTime)
	 */
	private Date lastDateTime;
}