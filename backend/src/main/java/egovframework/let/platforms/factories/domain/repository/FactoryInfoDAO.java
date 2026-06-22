package egovframework.let.platforms.factories.domain.repository;

import java.util.List;

import egovframework.let.platforms.factories.domain.model.PlatformTenantDashboardItemVO;
import egovframework.let.platforms.factories.domain.model.PlatformTenantDashboardQueryVO;
import egovframework.let.platforms.factories.domain.model.SampleTenantVO;

/**
 * 플랫폼 공장 DAO
 * @author AI Assistant
 * @since 2026.06.22
 * @version 1.0
 */
public interface FactoryInfoDAO {

    /**
     * 최대 공장 코드를 조회한다.
     * @return 최대 공장 코드
     */
    String selectMaxFactoryCode();

    /**
     * 공장을 등록한다.
     * @param factoryCode 공장 코드
     * @param factoryNm 공장명
     * @param tenantCode 테넌트 코드
     * @param adminEmail 관리자 이메일
     * @param corporateNumber 법인 번호
     * @param businessType 업태
     * @param businessCategory 업종
     * @return 등록 건수
     */
    int insertFactory(
            String factoryCode,
            String factoryNm,
            String tenantCode,
            String adminEmail,
            String corporateNumber,
            String businessType,
            String businessCategory);

    /**
     * 테넌트 수를 조회한다.
     * @param queryVO 조회 조건
     * @param useAtOnly 사용 여부 필터
     * @return 테넌트 수
     */
    int selectTenantCount(PlatformTenantDashboardQueryVO queryVO, String useAtOnly);

    /**
     * 대시보드 테넌트 항목 목록을 조회한다.
     * @param queryVO 조회 조건
     * @return 테넌트 항목 목록
     */
    List<PlatformTenantDashboardItemVO> selectDashboardTenantItems(PlatformTenantDashboardQueryVO queryVO);

    /**
     * 최근 등록된 테넌트 목록을 조회한다.
     * @param limit 조회 건수
     * @return 테넌트 목록
     */
    List<SampleTenantVO> selectRecentTenants(int limit);
}
