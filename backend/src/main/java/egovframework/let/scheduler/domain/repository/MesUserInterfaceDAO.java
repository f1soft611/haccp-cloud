package egovframework.let.scheduler.domain.repository;

import egovframework.let.scheduler.domain.model.ErpEmployee;
import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

/**
 * MES 사용자 정보 인터페이스 DAO (MES 데이터베이스 쓰기)
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
@Repository("mesUserInterfaceDAO")
public class MesUserInterfaceDAO extends EgovAbstractMapper {

	/**
	 * MES 사용자 테이블에 사원 정보 존재 여부 확인
	 * @param empId 사원번호
	 * @return 존재 개수
	 * @throws Exception
	 */
	public int selectMesUserCount(String empId) throws Exception {
		return (Integer) selectOne("MesUserInterfaceDAO.selectMesUserCount", empId);
	}

	/**
	 * MES 사용자 테이블에 사원 정보 삽입
	 * @param employee ERP 사원 정보
	 * @throws Exception
	 */
	public void insertMesUser(ErpEmployee employee) throws Exception {
		insert("MesUserInterfaceDAO.insertMesUser", employee);
	}

	/**
	 * MES 사용자 테이블의 사원 정보 업데이트
	 * @param employee ERP 사원 정보
	 * @throws Exception
	 */
	public void updateMesUser(ErpEmployee employee) throws Exception {
		update("MesUserInterfaceDAO.updateMesUser", employee);
	}
}
