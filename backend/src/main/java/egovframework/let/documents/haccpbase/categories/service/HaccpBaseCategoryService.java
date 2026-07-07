package egovframework.let.documents.haccpbase.categories.service;

import java.util.List;

import egovframework.let.documents.haccpbase.categories.domain.model.HaccpBaseCategorySaveRequestVO;
import egovframework.let.documents.haccpbase.categories.domain.model.HaccpBaseCategoryVO;

/**
 * HACCP 양식 업무 분류 관리를 위한 서비스 인터페이스 클래스
 * @author SHMT-MES
 * @since 2026.07.07
 * @version 1.0
 */
public interface HaccpBaseCategoryService {

    /**
     * 업무 분류 목록을 조회한다.
     *
     * @param tenantCode
     * @param active
     * @exception Exception
     */
    public List<HaccpBaseCategoryVO> listCategories(String tenantCode, String active) throws Exception;

    /**
     * 업무 분류를 등록한다.
     *
     * @param payload
     * @param actorLoginCode
     * @exception Exception
     */
    public HaccpBaseCategoryVO createCategory(HaccpBaseCategorySaveRequestVO payload, String actorLoginCode)
            throws Exception;

    /**
     * 업무 분류를 수정한다.
     *
     * @param id
     * @param payload
     * @param actorLoginCode
     * @exception Exception
     */
    public HaccpBaseCategoryVO updateCategory(Long id, HaccpBaseCategorySaveRequestVO payload, String actorLoginCode)
            throws Exception;
}
