package egovframework.let.basicinfo.materials.service;

import java.util.Map;

import egovframework.let.basicinfo.materials.domain.model.MaterialSaveRequestVO;
import egovframework.let.basicinfo.materials.domain.model.MaterialVO;

/**
 * 품목 관리를 위한 서비스 인터페이스
 * @author SHMT-MES
 * @since 2026.08.14
 * @version 1.0
 */
public interface MaterialService {

    Map<String, Object> listMaterialsPaged(int pageIndex, int pageSize, String keyword, String tenantCode) throws Exception;

    MaterialVO createMaterial(MaterialSaveRequestVO payload) throws Exception;

    MaterialVO updateMaterial(Long materialId, MaterialSaveRequestVO payload) throws Exception;

    void deleteMaterial(Long materialId, String tenantCode) throws Exception;
}
