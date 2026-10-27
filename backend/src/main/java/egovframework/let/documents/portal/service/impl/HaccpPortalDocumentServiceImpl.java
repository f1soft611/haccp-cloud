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

    private final HaccpPortalDocumentDAO haccpPortalDocumentDAO;
    private final TenantInfoDAO tenantInfoDAO;
    private final HaccpWorkDAO haccpWorkDAO;

    // 기존 -> listPortalDocuments(String tenantCode): 역할과 무관하게 전체 업무 조회
    // 변경 -> PLATFORM_ADMIN, TENANT_ADMIN 외 역할(빈 값 포함)은 본인 담당 업무만 조회
    @Override
    public List<HaccpPortalDocumentVO> listPortalDocuments(String tenantCode, String actorLoginCode, String roleCode) throws Exception {
        String normalizedTenantCode = normalizeTenantCode(tenantCode);
        Long tenantId = tenantInfoDAO.selectTenantIdByCode(normalizedTenantCode);

        HaccpPortalDocumentSearchConditionVO condition = new HaccpPortalDocumentSearchConditionVO();
        condition.setTenantId(tenantId);
        condition.setTenantCode(normalizedTenantCode);
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
