package egovframework.let.scheduler.domain.repository;

import egovframework.let.scheduler.domain.model.ErpItem;
import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

/**
 * MES 품목 정보 인터페이스 DAO (MES 데이터베이스 쓰기)
 * 
 * @author SHMT-MES
 * @since 2025.11.24
 * @version 1.0
 * @see
 *
 * <pre>
 * << 개정이력(Modification Information) >>
 *
 *   수정일      수정자           수정내용
 *  -------    --------    ---------------------------
 *   2025.11.24 SHMT-MES          최초 생성
 *
 * </pre>
 */
@Repository("mesItemInterfaceDAO")
public class MesItemInterfaceDAO extends EgovAbstractMapper {

	/**
	 * MES 품목 테이블에 품목 정보 존재 여부 확인
	 * @param item 품목코드
	 * @return 존재 개수
	 * @throws Exception
	 */
	public int selectMesItemCount(ErpItem item) throws Exception {
		return (Integer) selectOne("MesItemInterfaceDAO.selectMesItemCount", item);
	}

	/**
	 * MES 품목 테이블에 품목 정보 삽입
	 * @param item ERP 품목 정보
	 * @throws Exception
	 */
	public void insertMesItem(ErpItem item) throws Exception {
		insert("MesItemInterfaceDAO.insertMesItem", item);
	}

	/**
	 * MES 품목 테이블의 품목 정보 업데이트
	 * @param item ERP 품목 정보
	 * @throws Exception
	 */
	public void updateMesItem(ErpItem item) throws Exception {
		update("MesItemInterfaceDAO.updateMesItem", item);
	}
}
