package egovframework.let.scheduler.domain.model;

import lombok.Data;
import java.math.BigDecimal;
import java.util.Date;

/**
 * ERP 제품별공정별소요자재 인터페이스 모델
 * SHM_IF_VIEW_TPDROUItemProcMat → TCO501
 * @author SHMT-MES
 * @since 2025.12.08
 */
@Data
public class ErpTPDROUItemProcMat {
    private int CompanySeq;         // 법인코드
    private int ItemSeq;            // 품목코드
    private String BOMRev;          // BOM차수
    private String ProcRev;         // 공정차수
    private int ProcSeq;            // 공정코드
    private int Serl;               // 순번
    private int MatItemSeq;         // 자재코드
    private int UnitSeq;            // 단위코드
    private BigDecimal NeedQtyNumerator;   // 소요량분자
    private BigDecimal NeedQtyDenominator; // 소요량분모
    private int SMDelvType;         // 조달구분코드
    private int UpperItemSeq;       // 상위품목코드
    private String UpperBOMRev;     // 상위BOM차수
    private int BOMItemSerl;        // 순번
    private int LastUserSeq;        // 최종수정자내부코드
    private Date LastDateTime;      // 최종수정일시
}
