package egovframework.let.scheduler.domain.model;

import lombok.Data;
import java.io.Serializable;
import java.util.Date;

/**
 * ERP 사원 정보 DTO
 * ERP의 SHM_IF_VIEW_TDAEmp 뷰 테이블 구조에 매핑되는 도메인 모델
 * 
 * @author SHMT-MES
 * @since 2025.11.06
 * @version 1.0
 */
@Data
public class ErpEmployee implements Serializable {
	private static final long serialVersionUID = 1L;

	/**
	 * 법인코드 (CompanySeq)
	 */
	private Integer companySeq;

	/**
	 * 사원코드 (EmpSeq)
	 */
	private Integer empSeq;

	/**
	 * 사원번호 (EmpId) - nvarchar(40)
	 */
	private String empId;

	/**
	 * 사원명 (EmpName) - nvarchar(100)
	 */
	private String empName;

	/**
	 * 직무코드 (UMPgSeq)
	 */
	private Integer umPgSeq;

	/**
	 * 직무명 (UMPgName) - nvarchar(100)
	 */
	private String umPgName;

	/**
	 * 부서코드 (DeptSeq)
	 */
	private Integer deptSeq;

	/**
	 * 부서명 (DeptName) - nvarchar(100)
	 */
	private String deptName;

	/**
	 * 재직자/퇴직자코드 ex) 0:재직자, 1:퇴직자 (TypeSeq)
	 */
	private Integer typeSeq;

	/**
	 * 재직자/퇴직자 (TypeName) - nvarchar(100)
	 */
	private String typeName;

	/**
	 * e-mail (G-기본호표) (Email) - nvarchar(50)
	 */
	private String email;

	/**
	 * 사용자id (ERP 로그인 ID) (UserId) - nvarchar(100)
	 */
	private String userId;

	/**
	 * 사용자번호코드 (UserSeq)
	 */
	private Integer userSeq;

	/**
	 * 최종수정자코드 (LastUserSeq)
	 */
	private Integer lastUserSeq;

	/**
	 * 최종수정일시 (LastDateTime)
	 */
	private Date lastDateTime;

	/**
	 * 비밀번호 세팅용
	 */
	private String password = "";
}
