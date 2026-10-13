package egovframework.let.basicinfo.commoncode.domain.repository;

import java.util.List;
import java.util.Map;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.basicinfo.commoncode.domain.model.CommonCodeGroupVO;
import egovframework.let.basicinfo.commoncode.domain.model.CommonCodeItemVO;

/**
 * 공통코드 관리를 위한 데이터 접근 클래스
 * @author SHMT-MES
 * @since 2026.10.08
 * @version 1.0
 */
@Repository("commonCodeDAO")
public class CommonCodeDAO extends EgovAbstractMapper {

    public Long selectTenantIdByCode(String tenantCode) throws Exception {
        return selectOne("CommonCodeDAO.selectTenantIdByCode", tenantCode);
    }

    public Long selectUserIdByLoginCode(Map<String, Object> params) throws Exception {
        return selectOne("CommonCodeDAO.selectUserIdByLoginCode", params);
    }

    public List<CommonCodeGroupVO> selectGroupList(Long tenantId) throws Exception {
        return selectList("CommonCodeDAO.selectGroupList", tenantId);
    }

    public List<CommonCodeItemVO> selectItemList(Long tenantId) throws Exception {
        return selectList("CommonCodeDAO.selectItemList", tenantId);
    }

    // 기존 -> public Long upsertGroup(...) { return selectOne(...); }  (그룹 PK 반환)
    // 변경 -> 상세가 그룹코드로 그룹을 찾으므로 PK 불필요
    public void upsertGroup(Map<String, Object> params) throws Exception {
        insert("CommonCodeDAO.upsertGroup", params);
    }

    public void upsertItem(Map<String, Object> params) throws Exception {
        insert("CommonCodeDAO.upsertItem", params);
    }

    // 기존 -> deleteMissing(params): 참조 해제 → 상세 → 그룹 물리 삭제
    // 변경 -> 물리 삭제 금지. params: tenantId, userId, groups (payload에 없는 그룹이 미사용 대상)
    public void disableMissingGroups(Map<String, Object> params) throws Exception {
        update("CommonCodeDAO.disableMissingGroups", params);
    }

    /** params: tenantId, groups, details (payload에 없는 행이 삭제 대상) */
    public void deleteMissing(Map<String, Object> params) throws Exception {
        // FK가 ON DELETE RESTRICT 라서 참조 해제 → 상세 → 그룹 순서로 지운다.
        update("CommonCodeDAO.clearDeletedItemParentRefs", params);
        delete("CommonCodeDAO.deleteMissingItems", params);
        update("CommonCodeDAO.clearDeletedGroupParentRefs", params);
        delete("CommonCodeDAO.deleteMissingGroups", params);
    }
}