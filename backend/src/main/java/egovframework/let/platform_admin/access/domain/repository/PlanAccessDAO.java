package egovframework.let.platform_admin.access.domain.repository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.platform_admin.access.domain.model.PlanFeatureItemVO;
import egovframework.let.platform_admin.access.domain.model.PlanFeatureStatusVO;
import egovframework.let.platform_admin.access.domain.model.PlanSummaryVO;

/**
 * 플랜 접근 제어 DAO
 * @author SHMT-MES
 * @since 2026.07.03
 * @version 1.0
 * @see
 *
 * <pre>
 * << 개정이력(Modification Information) >>
 *
 *   수정일      수정자           수정내용
 *  -------    --------    ---------------------------
 *   2026.07.03 SHMT-MES          최초 생성
 *
 * </pre>
 */
@Repository("planAccessDAO")
public class PlanAccessDAO extends EgovAbstractMapper {

    /**
     * 플랜 스키마 준비 여부를 위한 테이블 수를 조회한다.
     * @return 스키마 테이블 수
     * @throws Exception
     */
    public int selectPlanSchemaTableCount() throws Exception {
        Integer count = selectOne("PlanAccessDAO.selectPlanSchemaTableCount");
        return count == null ? 0 : count;
    }

    /**
     * 테넌트의 최신 구독에서 특정 feature 사용여부 코드를 조회한다.
     * @param tenantId 테넌트 ID
     * @param subscriptionStatus 구독 상태
     * @param featureCode feature 코드
     * @return enabled_at 값
     * @throws Exception
     */
    public String selectLatestFeatureEnabledAt(Long tenantId, String subscriptionStatus, String featureCode) throws Exception {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("tenantId", tenantId);
        param.put("subscriptionStatus", subscriptionStatus);
        param.put("featureCode", featureCode);
        return selectOne("PlanAccessDAO.selectLatestFeatureEnabledAt", param);
    }

    /**
     * 테넌트의 최신 구독에서 특정 제한값을 조회한다.
     * @param tenantId 테넌트 ID
     * @param subscriptionStatus 구독 상태
     * @param featureCode feature 코드
     * @param featureType feature 타입
     * @param enabledAt 활성값
     * @return 제한값
     * @throws Exception
     */
    public Long selectLatestFeatureLimitValue(
            Long tenantId,
            String subscriptionStatus,
            String featureCode,
            String featureType,
            String enabledAt) throws Exception {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("tenantId", tenantId);
        param.put("subscriptionStatus", subscriptionStatus);
        param.put("featureCode", featureCode);
        param.put("featureType", featureType);
        param.put("enabledAt", enabledAt);
        return selectOne("PlanAccessDAO.selectLatestFeatureLimitValue", param);
    }

    /**
     * 테넌트의 활성 플랜 코드를 조회한다.
     * @param tenantId 테넌트 ID
     * @param subscriptionStatus 구독 상태
     * @return 플랜 코드
     * @throws Exception
     */
    public String selectActivePlanCode(Long tenantId, String subscriptionStatus) throws Exception {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("tenantId", tenantId);
        param.put("subscriptionStatus", subscriptionStatus);
        return selectOne("PlanAccessDAO.selectActivePlanCode", param);
    }

    /**
     * 테넌트 코드로 테넌트 ID를 조회한다.
     * @param tenantCode 테넌트 코드
     * @return 테넌트 ID
     * @throws Exception
     */
    public Long selectTenantIdByTenantCode(String tenantCode) throws Exception {
        return selectOne("PlanAccessDAO.selectTenantIdByTenantCode", tenantCode);
    }

    /**
     * 테넌트의 feature 활성 상태 목록을 조회한다.
     * @param tenantId 테넌트 ID
     * @param subscriptionStatus 구독 상태
     * @return feature 상태 목록
     * @throws Exception
     */
    public List<PlanFeatureStatusVO> selectFeatureEnabledListByTenantId(Long tenantId, String subscriptionStatus) throws Exception {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("tenantId", tenantId);
        param.put("subscriptionStatus", subscriptionStatus);
        return selectList("PlanAccessDAO.selectFeatureEnabledListByTenantId", param);
    }

    /**
     * 플랜 목록을 조회한다.
     * @return 플랜 목록
     * @throws Exception
     */
    public List<PlanSummaryVO> selectPlanList() throws Exception {
        return selectList("PlanAccessDAO.selectPlanList");
    }

    /**
     * 플랜 코드 기준 feature 활성 상태 목록을 조회한다.
     * @param planCode 플랜 코드
     * @return feature 상태 목록
     * @throws Exception
     */
    public List<PlanFeatureStatusVO> selectFeatureEnabledListByPlanCode(String planCode) throws Exception {
        return selectList("PlanAccessDAO.selectFeatureEnabledListByPlanCode", planCode);
    }

    /**
     * 플랜 코드 기준 feature 상세 목록을 조회한다.
     * @param planCode 플랜 코드
     * @return feature 상세 목록
     * @throws Exception
     */
    public List<PlanFeatureItemVO> selectPlanFeatureItems(String planCode) throws Exception {
        return selectList("PlanAccessDAO.selectPlanFeatureItems", planCode);
    }

    /**
     * 플랜 코드 기준 허용 메뉴 코드를 조회한다.
     * @param planCode 플랜 코드
     * @return 메뉴 코드 목록
     * @throws Exception
     */
    public List<String> selectPlanMenuCodes(String planCode) throws Exception {
        return selectList("PlanAccessDAO.selectPlanMenuCodes", planCode);
    }

    /**
     * 플랜 코드 기준 기존 메뉴 매핑을 삭제한다.
     * @param planCode 플랜 코드
     * @throws Exception
     */
    public void deletePlanMenusByPlanCode(String planCode) throws Exception {
        delete("PlanAccessDAO.deletePlanMenusByPlanCode", planCode);
    }

    /**
     * 플랜-메뉴 매핑을 저장한다.
     * @param planCode 플랜 코드
     * @param menuCode 메뉴 코드
     * @throws Exception
     */
    public void upsertPlanMenu(String planCode, String menuCode) throws Exception {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("planCode", planCode);
        param.put("menuCode", menuCode);
        insert("PlanAccessDAO.upsertPlanMenu", param);
    }

    /**
     * 테넌트 활성 사용자 수를 조회한다.
     * @param tenantId 테넌트 ID
     * @return 활성 사용자 수
     * @throws Exception
     */
    public Long selectActiveUserCountByTenantId(Long tenantId) throws Exception {
        Long count = selectOne("PlanAccessDAO.selectActiveUserCountByTenantId", tenantId);
        return count == null ? 0L : count;
    }
}
