package egovframework.let.scheduler.domain.model;

import lombok.Data;
import java.io.Serializable;
import java.util.Date;

/**
 * ERP 품목 정보 DTO
 * ERP의 SHM_IF_VIEW_TDAItem 뷰 테이블 구조에 매핑되는 도메인 모델
 *
 * @author SHMT-MES
 * @since 2025.11.24
 * @version 1.0
 */
@Data
public class ErpItem implements Serializable {
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
	 * 품목번호 (ItemNo) - nvarchar(100)
	 */
	private String itemNo;

	/**
	 * 내부품목코드 (ItemSeq)
	 */
	private String itemSeq;

	/**
	 * 품목명 (ItemName) - nvarchar(200)
	 */
	private String itemName;

	/**
	 * 규격 (Spec) - nvarchar(100)
	 */
	private String spec;

	/**
	 * 단위코드 (UnitSeq)
	 */
	private Integer unitSeq;

	/**
	 * 단위코드명 (UnitName) - nvarchar(50)
	 */
	private String unitName;

	/**
	 * 품목자산분류코드 (AssetSeq)
	 */
	private Integer assetSeq;

	/**
	 * 품목자산분류코드명 (AssetName) - nvarchar(100)
	 */
	private String assetName;

	/**
	 * 최종수정자내부코드 (LastUserSeq)
	 */
	private Integer lastUserSeq;

	/**
	 * 최종수정일시 (LastDateTime)
	 */
	private Date lastDateTime;
}
