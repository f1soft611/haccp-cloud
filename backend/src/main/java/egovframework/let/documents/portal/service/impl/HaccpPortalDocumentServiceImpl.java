package egovframework.let.documents.portal.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.egovframe.rte.fdl.cmmn.EgovAbstractServiceImpl;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import egovframework.let.documents.haccpwork.domain.repository.HaccpWorkDAO;
import egovframework.let.documents.portal.domain.model.HaccpPortalDocumentSearchConditionVO;
import egovframework.let.documents.portal.domain.model.HaccpPortalDocumentVO;
import egovframework.let.documents.portal.domain.repository.HaccpPortalDocumentDAO;
import egovframework.let.documents.portal.service.HaccpPortalDocumentService;
import egovframework.let.platform_admin.tenants.domain.repository.TenantInfoDAO;
import lombok.RequiredArgsConstructor;

/**
 * HACCP 문서포탈 조회 서비스 구현
 */
@Service("haccpPortalDocumentService")
@RequiredArgsConstructor
public class HaccpPortalDocumentServiceImpl extends EgovAbstractServiceImpl implements HaccpPortalDocumentService {

    // 분류 미지정(화면 표시명 '기타문서') 업무만 조회할 때 쓰는 업무분류 값
    private static final String UNCATEGORIZED = "NONE";

    private final HaccpPortalDocumentDAO haccpPortalDocumentDAO;
    private final TenantInfoDAO tenantInfoDAO;
    private final HaccpWorkDAO haccpWorkDAO;

    @Override
    public List<HaccpPortalDocumentVO> listPortalDocuments(String tenantCode, String actorLoginCode, String roleCode,
            String categoryId, String cycle, String keyword) throws Exception {
        String normalizedTenantCode = normalizeTenantCode(tenantCode);
        Long tenantId = tenantInfoDAO.selectTenantIdByCode(normalizedTenantCode);

        HaccpPortalDocumentSearchConditionVO condition = new HaccpPortalDocumentSearchConditionVO();
        condition.setTenantId(tenantId);
        condition.setTenantCode(normalizedTenantCode);
        applyCategory(condition, categoryId);
        condition.setCycle(normalizeText(cycle));
        condition.setKeyword(normalizeText(keyword));
        if (!isFullAccessRole(roleCode)) {
            String loginCode = StringUtils.hasText(actorLoginCode) ? actorLoginCode.trim() : null;
            Long actorLoginId = resolveActorLoginId(tenantId, loginCode);
            condition.setOnlyAssigned(true);
            condition.setActorLoginCode(loginCode);
            condition.setActorLoginId(actorLoginId);
            condition.setActorUserId(resolveActorUserId(tenantId, actorLoginId));
        }
        return haccpPortalDocumentDAO.selectPortalDocuments(condition);
    }

    // 업무분류 값이 NONE 이면 분류 미지정 조회, 숫자면 분류 ID 조회, 그 밖(빈 값, ALL 등)은 조건 없음
    private void applyCategory(HaccpPortalDocumentSearchConditionVO condition, String categoryId) {
        String normalized = normalizeText(categoryId);
        if (normalized == null) {
            return;
        }
        if (UNCATEGORIZED.equalsIgnoreCase(normalized)) {
            condition.setUncategorized(true);
            return;
        }
        if (normalized.matches("\\d+")) {
            condition.setCategoryId(Long.valueOf(normalized));
        }
    }

    // 앞뒤 공백을 지우고 빈 값이면 조건을 걸지 않도록 null 로 만든다
    private String normalizeText(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private boolean isFullAccessRole(String roleCode) {
        String normalized = StringUtils.hasText(roleCode) ? roleCode.trim().toUpperCase() : "";
        return "PLATFORM_ADMIN".equals(normalized) || "TENANT_ADMIN".equals(normalized);
    }

    private Long resolveActorLoginId(Long tenantId, String loginCode) throws Exception {
        if (tenantId == null || loginCode == null) {
            return null;
        }

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("loginCode", loginCode);
        return haccpWorkDAO.selectLoginIdByTenantAndLoginCode(params);
    }

    private Long resolveActorUserId(Long tenantId, Long actorLoginId) throws Exception {
        if (tenantId == null || actorLoginId == null) {
            return null;
        }

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("loginId", actorLoginId);
        return haccpWorkDAO.selectUserIdByTenantAndLoginId(params);
    }

    private String normalizeTenantCode(String tenantCode) {
        return StringUtils.hasText(tenantCode) ? tenantCode.trim().toUpperCase() : "";
    }
}
