package egovframework.let.scheduler.domain.model;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.io.Serializable;
import java.sql.Timestamp;

/**
 * ERP 워크센터 정보를 담는 데이터 모델 클래스
 * ERP 시스템의 SHM_IF_VIEW_TPDBaseWorkCenter 뷰와 매핑
 *
 * @author SHMT-MES
 * @since 2026.02.13
 * @version 1.0
 */
@Getter
@Setter
@ToString
public class ErpWorkCenter implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 법인코드
     */
    private Integer companySeq;

    /**
     * 워크센터코드
     */
    private Integer workCenterSeq;

    /**
     * 워크센터명
     */
    private String workCenterName;

    /**
     * 비고
     */
    private String remark;

    /**
     * 최종수정자Seq
     */
    private Integer lastUserSeq;

    /**
     * 최종수정일시
     */
    private Timestamp lastDateTime;
}
