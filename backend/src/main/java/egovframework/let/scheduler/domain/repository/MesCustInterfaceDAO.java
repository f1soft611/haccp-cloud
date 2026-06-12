package egovframework.let.scheduler.domain.repository;

import egovframework.let.scheduler.domain.model.ErpCustomer;
import egovframework.let.scheduler.domain.model.ErpEmployee;
import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

/**
 * MES 거래처 정보 인터페이스 DAO (MES 데이터베이스 쓰기)
 * 
 * @author SHMT-MES
 * @since 2025.11.06
 * @version 1.0
 * @see
 *
 * <pre>
 * << 개정이력(Modification Information) >>
 *
 *   수정일      수정자           수정내용
 *  -------    --------    ---------------------------
 *   2025.11.06 SHMT-MES          최초 생성
 *
 * </pre>
 */
@Repository("mesCustInterfaceDAO")
public class MesCustInterfaceDAO extends EgovAbstractMapper {

	/**
	 * MES 거래처 테이블에 거래처 정보 존재 여부 확인
	 * @param custSeq 거래처번호
	 * @return 존재 개수
	 * @throws Exception
	 */
	public int selectMesCustCount(int custSeq) throws Exception {
		return (Integer) selectOne("MesCustInterfaceDAO.selectMesCustCount", custSeq);
	}

	/**
	 * MES 거래처 테이블에 거래처 정보 삽입
	 * @param customer ERP 거래처 정보
	 * @throws Exception
	 */
	public void insertMesCust(ErpCustomer customer) throws Exception {
		insert("MesCustInterfaceDAO.insertMesCust", customer);
	}

	/**
	 * MES 거래처 테이블의 거래처 정보 업데이트
	 * @param customer ERP 거래처 정보
	 * @throws Exception
	 */
	public void updateMesCust(ErpCustomer customer) throws Exception {
		update("MesCustInterfaceDAO.updateMesCust", customer);
	}
}
