package egovframework.let.basicinfo.customers.service;

import java.util.Map;

import egovframework.let.basicinfo.customers.domain.model.CustomerSaveRequestVO;
import egovframework.let.basicinfo.customers.domain.model.CustomerVO;

/**
 * 거래처 관리를 위한 서비스 인터페이스
 * @author SHMT-MES
 * @since 2026.08.14
 * @version 1.0
 */
public interface CustomerService {

    Map<String, Object> listCustomersPaged(int pageIndex, int pageSize, String keyword, String filterActive, String tenantCode) throws Exception;

    CustomerVO createCustomer(CustomerSaveRequestVO payload) throws Exception;

    CustomerVO updateCustomer(Long customerId, CustomerSaveRequestVO payload) throws Exception;

    void deleteCustomer(Long customerId, String tenantCode) throws Exception;
}
