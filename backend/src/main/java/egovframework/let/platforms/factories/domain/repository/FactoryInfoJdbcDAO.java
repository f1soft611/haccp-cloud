package egovframework.let.platforms.factories.domain.repository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.platforms.factories.domain.model.PlatformTenantDashboardItemVO;
import egovframework.let.platforms.factories.domain.model.PlatformTenantDashboardQueryVO;
import egovframework.let.platforms.factories.domain.model.SampleTenantVO;

@Repository("factoryInfoDAO")
public class FactoryInfoJdbcDAO extends EgovAbstractMapper implements FactoryInfoDAO {

    /**
     * 가장 큰 6자리 업체코드를 조회한다.
     * @return 최대 업체코드
     */
    @Override
    public String selectMaxFactoryCode() {
        return selectOne("FactoryInfoDAO.selectMaxFactoryCode");
    }

    /**
     * 업체를 등록한다.
     * @param factoryCode 업체코드
     * @param factoryNm 업체명
     * @param tenantCode 테넌트코드
     * @param adminEmail 관리자 이메일
     * @param corporateNumber 법인번호
     * @param businessType 업종
     * @param businessCategory 업태
     * @return 반영 건수
     */
    @Override
    public int insertFactory(
            String factoryCode,
            String factoryNm,
            String tenantCode,
            String adminEmail,
            String corporateNumber,
            String businessType,
            String businessCategory) {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("factoryCode", factoryCode);
        param.put("factoryNm", factoryNm);
        param.put("tenantCode", tenantCode);
        param.put("adminEmail", adminEmail);
        param.put("corporateNumber", corporateNumber);
        param.put("businessType", businessType);
        param.put("businessCategory", businessCategory);
        return insert("FactoryInfoDAO.insertFactory", param);
    }

    /**
     * 대시보드 테넌트 조건별 건수를 조회한다.
     * @param queryVO 검색조건
     * @param useAtOnly 사용여부 필터(Y/N)
     * @return 건수
     */
    @Override
    public int selectTenantCount(PlatformTenantDashboardQueryVO queryVO, String useAtOnly) {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("searchField", queryVO.getSearchField());
        param.put("searchKeyword", queryVO.getSearchKeyword());
        param.put("status", queryVO.getStatus());
        param.put("useAtOnly", useAtOnly);

        Integer count = selectOne("FactoryInfoDAO.selectTenantCount", param);
        return count == null ? 0 : count;
    }

    /**
     * 대시보드 테넌트 목록을 조회한다.
     * @param queryVO 검색조건
     * @return 대시보드 테넌트 목록
     */
    @Override
    public List<PlatformTenantDashboardItemVO> selectDashboardTenantItems(PlatformTenantDashboardQueryVO queryVO) {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("pageIndex", queryVO.getPageIndex());
        param.put("pageSize", queryVO.getPageSize());
        param.put("searchField", queryVO.getSearchField());
        param.put("searchKeyword", queryVO.getSearchKeyword());
        param.put("status", queryVO.getStatus());
        return selectList("FactoryInfoDAO.selectDashboardTenantItems", param);
    }

    /**
     * 최근 발급 테넌트 목록을 조회한다.
     * @param limit 조회 건수
     * @return 최근 테넌트 목록
     */
    @Override
    public List<SampleTenantVO> selectRecentTenants(int limit) {
        int safeLimit = limit <= 0 ? 5 : Math.min(limit, 50);

        Map<String, Object> param = new HashMap<String, Object>();
        param.put("limit", safeLimit);
        return selectList("FactoryInfoDAO.selectRecentTenants", param);
    }
}
