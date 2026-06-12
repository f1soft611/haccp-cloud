package egovframework.let.scheduler.domain.repository;

import egovframework.let.scheduler.domain.model.ErpProductionRequest;
import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

/**
 * MES 생산 의뢰 정보 인터페이스 DAO (MES 데이터베이스 쓰기)
 * 
 * @author SHMT-MES
 * @since 2025.11.19
 * @version 1.0
 * @see
 *
 * <pre>
 * << 개정이력(Modification Information) >>
 *
 *   수정일      수정자           수정내용
 *  -------    --------    ---------------------------
 *   2025.11.19 SHMT-MES          최초 생성
 *
 * </pre>
 */
@Repository("mesProdReqInterfaceDAO")
public class MesProdReqInterfaceDAO extends EgovAbstractMapper {

	/**
	 * MES 생산 의뢰 테이블에 생산 의뢰 정보 존재 여부 확인
	 * @param prodReqSeq 생산의뢰코드
	 * @return 존재 개수
	 * @throws Exception
	 */
	public int selectMesProdReqCount(ErpProductionRequest prodReq) throws Exception {
		return (Integer) selectOne("MesProdReqInterfaceDAO.selectMesProdReqCount", prodReq);
	}

	/**
	 * MES 생산 의뢰 테이블에 생산 의뢰 정보 삽입
	 * @param prodReq ERP 생산 의뢰 정보
	 * @throws Exception
	 */
	public void insertMesProdReq(ErpProductionRequest prodReq) throws Exception {
		insert("MesProdReqInterfaceDAO.insertMesProdReq", prodReq);
	}

	/**
	 * MES 생산 의뢰 테이블의 생산 의뢰 정보 업데이트
	 * @param prodReq ERP 생산 의뢰 정보
	 * @throws Exception
	 */
	public void updateMesProdReq(ErpProductionRequest prodReq) throws Exception {
		update("MesProdReqInterfaceDAO.updateMesProdReq", prodReq);
	}
}
