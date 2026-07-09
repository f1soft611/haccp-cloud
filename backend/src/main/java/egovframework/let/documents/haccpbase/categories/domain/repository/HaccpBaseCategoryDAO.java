package egovframework.let.documents.haccpbase.categories.domain.repository;

import java.util.List;
import java.util.Map;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.documents.haccpbase.categories.domain.model.HaccpBaseCategorySearchConditionVO;
import egovframework.let.documents.haccpbase.categories.domain.model.HaccpBaseCategoryVO;

/**
 * HACCP 양식 업무 분류 관리를 위한 데이터 접근 클래스
 * @author SHMT-MES
 * @since 2026.07.07
 * @version 1.0
 */
@Repository("haccpBaseCategoryDAO")
public class HaccpBaseCategoryDAO extends EgovAbstractMapper {

    /**
     * 업무 분류 목록을 조회한다.
     */
    public List<HaccpBaseCategoryVO> selectCategoryList(HaccpBaseCategorySearchConditionVO condition) throws Exception {
        return selectList("HaccpBaseCategoryDAO.selectCategoryList", condition);
    }

    /**
     * 업무 분류 단건을 조회한다.
     */
    public HaccpBaseCategoryVO selectCategoryById(Map<String, Object> params) throws Exception {
        return selectOne("HaccpBaseCategoryDAO.selectCategoryById", params);
    }

    /**
     * tenant_id를 조회한다.
     */
    public Long selectTenantIdByCode(String tenantCode) throws Exception {
        return selectOne("HaccpBaseCategoryDAO.selectTenantIdByCode", tenantCode);
    }

    /**
     * login_id를 조회한다.
     */
    public Long selectLoginIdByTenantAndLoginCode(Map<String, Object> params) throws Exception {
        return selectOne("HaccpBaseCategoryDAO.selectLoginIdByTenantAndLoginCode", params);
    }

    /**
     * 업무 분류를 등록한다.
     */
    public Long insertCategory(Map<String, Object> payload) throws Exception {
        return selectOne("HaccpBaseCategoryDAO.insertCategory", payload);
    }

    /**
     * 업무 분류를 수정한다.
     */
    public void updateCategory(Map<String, Object> payload) throws Exception {
        update("HaccpBaseCategoryDAO.updateCategory", payload);
    }
}
