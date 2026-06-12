package egovframework.let.scheduler.domain.repository;

import egovframework.let.scheduler.domain.model.ErpTPDROUItemProcMat;
import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import java.util.Map;

/**
 * MES 제품별공정별소요자재(TCO501) 인터페이스 DAO (MES 데이터베이스 쓰기)
 * @author SHMT-MES
 * @since 2025.12.08
 */
@Repository("mesTPDROUItemProcMatInterfaceDAO")
public class MesTPDROUItemProcMatInterfaceDAO extends EgovAbstractMapper {

    /**
     * MES 제품별공정별소요자재(TCO501) 정보 존재 여부 확인
     * @param param 복합키 Map
     * @return 존재 개수
     * @throws Exception
     */
    public int selectMesTPDROUItemProcMatCount(Map<String, Object> param) throws Exception {
        return (Integer) selectOne("MesTPDROUItemProcMatInterfaceDAO.selectMesTPDROUItemProcMatCount", param);
    }

    /**
     * MES 제품별공정별소요자재(TCO501) 정보 삽입
     * @param param ERP 제품별공정별소요자재 정보
     * @throws Exception
     */
    public void insertMesTPDROUItemProcMat(Map<String, Object> param) throws Exception {
        insert("MesTPDROUItemProcMatInterfaceDAO.insertMesTPDROUItemProcMat", param);
    }

    /**
     * MES 제품별공정별소요자재(TCO501) 정보 업데이트
     * @param param ERP 제품별공정별소요자재 정보
     * @throws Exception
     */
    public void updateMesTPDROUItemProcMat(Map<String, Object> param) throws Exception {
        update("MesTPDROUItemProcMatInterfaceDAO.updateMesTPDROUItemProcMat", param);
    }
}
