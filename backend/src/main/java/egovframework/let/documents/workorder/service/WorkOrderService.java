package egovframework.let.documents.workorder.service;

import java.util.Map;

import egovframework.let.documents.workorder.domain.model.WorkOrderSaveRequestVO;
import egovframework.let.documents.workorder.domain.model.WorkOrderVO;

/**
 * 작업지시 관리를 위한 서비스 인터페이스
 * @author SHMT-MES
 * @since 2026.10.15
 * @version 1.0
 */
public interface WorkOrderService {

    Map<String, Object> listWorkOrdersPaged(int pageIndex, int pageSize, String startDate, String endDate,
                                            String keyword, String tenantCode) throws Exception;

    WorkOrderVO createWorkOrder(WorkOrderSaveRequestVO payload) throws Exception;

    WorkOrderVO updateWorkOrder(Long workdirectId, WorkOrderSaveRequestVO payload) throws Exception;

    void deleteWorkOrder(Long workdirectId, WorkOrderSaveRequestVO payload) throws Exception;
}