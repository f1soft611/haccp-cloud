package egovframework.let.basicinfo.equipment.service;

import java.util.Map;

import egovframework.let.basicinfo.equipment.domain.model.EquipmentSaveRequestVO;
import egovframework.let.basicinfo.equipment.domain.model.EquipmentVO;

/**
 * 설비 관리를 위한 서비스 인터페이스
 * @author SHMT-MES
 * @since 2026.08.14
 * @version 1.0
 */
public interface EquipmentService {

    Map<String, Object> listEquipmentPaged(int pageIndex, int pageSize, String keyword, String filterActive, String tenantCode) throws Exception;

    EquipmentVO createEquipment(EquipmentSaveRequestVO payload) throws Exception;

    EquipmentVO updateEquipment(Long equipmentId, EquipmentSaveRequestVO payload) throws Exception;

    void deleteEquipment(Long equipmentId, String tenantCode) throws Exception;
}
