package egovframework.let.basicinfo.customers.domain.repository;

import java.util.List;
import java.util.Map;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.basicinfo.customers.domain.model.CustomerSearchConditionVO;
import egovframework.let.basicinfo.customers.domain.model.CustomerVO;

/**
 * 거래처 관리를 위한 데이터 접근 클래스
 * @author SHMT-MES
 * @since 2026.08.14
 * @version 1.0
 */
@Repository("customerDAO")
public class CustomerDAO extends EgovAbstractMapper {

    public List<CustomerVO> selectCustomerPagedList(CustomerSearchConditionVO condition) throws Exception {
        return selectList("CustomerDAO.selectCustomerPagedList", condition);
    }

    public int selectCustomerPagedCount(CustomerSearchConditionVO condition) throws Exception {
        Integer count = selectOne("CustomerDAO.selectCustomerPagedCount", condition);
        return count == null ? 0 : count;
    }

    public CustomerVO selectCustomerById(Map<String, Object> params) throws Exception {
        return selectOne("CustomerDAO.selectCustomerById", params);
    }

    public Long selectTenantIdByCode(String tenantCode) throws Exception {
        return selectOne("CustomerDAO.selectTenantIdByCode", tenantCode);
    }

    public Long selectUserIdByLoginCode(Map<String, Object> params) throws Exception {
        return selectOne("CustomerDAO.selectUserIdByLoginCode", params);
    }

    public void lockTenantForCodeGeneration(Long tenantId) throws Exception {
        selectOne("CustomerDAO.lockTenantForCodeGeneration", tenantId);
    }

    public String selectMaxCustomerCode(Long tenantId) throws Exception {
        return selectOne("CustomerDAO.selectMaxCustomerCode", tenantId);
    }

    public Long insertCustomer(Map<String, Object> payload) throws Exception {
        return selectOne("CustomerDAO.insertCustomer", payload);
    }

    public void updateCustomer(Map<String, Object> payload) throws Exception {
        update("CustomerDAO.updateCustomer", payload);
    }

    public void deleteCustomer(Map<String, Object> params) throws Exception {
        delete("CustomerDAO.deleteCustomer", params);
    }
}
