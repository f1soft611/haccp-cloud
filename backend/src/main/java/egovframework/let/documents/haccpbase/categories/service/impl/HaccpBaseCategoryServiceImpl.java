package egovframework.let.documents.haccpbase.categories.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.egovframe.rte.fdl.cmmn.EgovAbstractServiceImpl;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import egovframework.let.documents.haccpbase.categories.domain.model.HaccpBaseCategorySaveRequestVO;
import egovframework.let.documents.haccpbase.categories.domain.model.HaccpBaseCategorySearchConditionVO;
import egovframework.let.documents.haccpbase.categories.domain.model.HaccpBaseCategoryVO;
import egovframework.let.documents.haccpbase.categories.domain.repository.HaccpBaseCategoryDAO;
import egovframework.let.documents.haccpbase.categories.service.HaccpBaseCategoryService;
import lombok.RequiredArgsConstructor;

/**
 * HACCP 양식 업무 분류 관리를 위한 서비스 구현 클래스
 * @author SHMT-MES
 * @since 2026.07.07
 * @version 1.0
 */
@Service("haccpBaseCategoryService")
@RequiredArgsConstructor
public class HaccpBaseCategoryServiceImpl extends EgovAbstractServiceImpl implements HaccpBaseCategoryService {

    private final HaccpBaseCategoryDAO haccpBaseCategoryDAO;

    /**
     * 업무 분류 목록을 조회한다.
     */
    @Override
    public List<HaccpBaseCategoryVO> listCategories(String tenantCode, String active) throws Exception {
        String normalizedTenantCode = normalizeTenantCode(tenantCode);
        Long tenantId = resolveTenantId(normalizedTenantCode);

        HaccpBaseCategorySearchConditionVO condition = new HaccpBaseCategorySearchConditionVO();
        condition.setTenantId(tenantId);
        condition.setTenantCode(normalizedTenantCode);
        condition.setActive(normalizeActive(active));
        return haccpBaseCategoryDAO.selectCategoryList(condition);
    }

    /**
     * 업무 분류를 등록한다.
     */
    @Override
    @Transactional
    public HaccpBaseCategoryVO createCategory(HaccpBaseCategorySaveRequestVO payload, String actorLoginCode)
            throws Exception {
        String tenantCode = normalizeTenantCode(payload.getTenantCode());
        if (!StringUtils.hasText(payload.getCategoryCode())) {
            throw new IllegalArgumentException("분류코드는 필수입니다.");
        }
        String categoryCode = payload.getCategoryCode().trim();
        if (categoryCode.length() > 3) {
            throw new IllegalArgumentException("분류코드는 최대 3자리까지 입력할 수 있습니다.");
        }
        if (!StringUtils.hasText(payload.getCategoryName())) {
            throw new IllegalArgumentException("분류명은 필수입니다.");
        }

        Long tenantId = resolveTenantId(tenantCode);
        Long actorLoginId = resolveActorLoginId(tenantId, actorLoginCode);

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("categoryCode", categoryCode);
        params.put("categoryName", payload.getCategoryName().trim());
        params.put("sortOrder", payload.getSortOrder() == null ? 0 : payload.getSortOrder());
        params.put("useAt", Boolean.FALSE.equals(payload.getActive()) ? "N" : "Y");
        params.put("createdBy", actorLoginId);
        params.put("updatedBy", actorLoginId);

        Long newId = haccpBaseCategoryDAO.insertCategory(params);

        Map<String, Object> lookupParams = new HashMap<String, Object>();
        lookupParams.put("id", newId);
        lookupParams.put("tenantId", tenantId);
        lookupParams.put("tenantCode", tenantCode);
        return haccpBaseCategoryDAO.selectCategoryById(lookupParams);
    }

    /**
     * 업무 분류를 수정한다.
     */
    @Override
    @Transactional
    public HaccpBaseCategoryVO updateCategory(Long id, HaccpBaseCategorySaveRequestVO payload, String actorLoginCode)
            throws Exception {
        String tenantCode = normalizeTenantCode(payload.getTenantCode());
        if (!StringUtils.hasText(payload.getCategoryName())) {
            throw new IllegalArgumentException("분류명은 필수입니다.");
        }

        Long tenantId = resolveTenantId(tenantCode);
        Long actorLoginId = resolveActorLoginId(tenantId, actorLoginCode);

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("id", id);
        params.put("tenantId", tenantId);
        params.put("categoryName", payload.getCategoryName().trim());
        params.put("sortOrder", payload.getSortOrder() == null ? 0 : payload.getSortOrder());
        params.put("useAt", Boolean.FALSE.equals(payload.getActive()) ? "N" : "Y");
        params.put("updatedBy", actorLoginId);
        haccpBaseCategoryDAO.updateCategory(params);

        Map<String, Object> lookupParams = new HashMap<String, Object>();
        lookupParams.put("id", id);
        lookupParams.put("tenantId", tenantId);
        lookupParams.put("tenantCode", tenantCode);
        HaccpBaseCategoryVO item = haccpBaseCategoryDAO.selectCategoryById(lookupParams);
        if (item == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "업무 분류를 찾을 수 없습니다.");
        }
        return item;
    }

    /**
     * 테넌트 코드를 tenant_id로 해석한다.
     */
    private Long resolveTenantId(String tenantCode) throws Exception {
        Long tenantId = haccpBaseCategoryDAO.selectTenantIdByCode(tenantCode);
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "테넌트를 찾을 수 없습니다: " + tenantCode);
        }
        return tenantId;
    }

    /**
     * 수행자 로그인 코드를 login_id로 해석한다.
     */
    private Long resolveActorLoginId(Long tenantId, String actorLoginCode) throws Exception {
        if (!StringUtils.hasText(actorLoginCode)) {
            return null;
        }

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("loginCode", actorLoginCode.trim());
        return haccpBaseCategoryDAO.selectLoginIdByTenantAndLoginCode(params);
    }

    /**
     * 테넌트 코드를 정규화한다.
     */
    private String normalizeTenantCode(String tenantCode) {
        return StringUtils.hasText(tenantCode) ? tenantCode.trim().toUpperCase() : "";
    }

    /**
     * 사용여부 값을 정규화한다.
     */
    private String normalizeActive(String active) {
        if (!StringUtils.hasText(active)) {
            return null;
        }
        String normalized = active.trim().toUpperCase();
        return ("Y".equals(normalized) || "N".equals(normalized)) ? normalized : null;
    }
}
