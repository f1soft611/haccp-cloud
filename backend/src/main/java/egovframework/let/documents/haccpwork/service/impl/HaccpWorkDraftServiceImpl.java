package egovframework.let.documents.haccpwork.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.egovframe.rte.fdl.cmmn.EgovAbstractServiceImpl;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import egovframework.let.documents.haccpwork.domain.model.HaccpWorkSearchConditionVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkVO;
import egovframework.let.documents.haccpwork.domain.repository.HaccpWorkDAO;
import egovframework.let.documents.haccpwork.service.HaccpWorkDraftService;
import lombok.RequiredArgsConstructor;

/**
 * HACCP 업무 기안 조회를 위한 서비스 구현 클래스
 * @author SHMT-MES
 * @since 2026.07.16
 * @version 1.0
 */
@Service("haccpWorkDraftService")
@RequiredArgsConstructor
public class HaccpWorkDraftServiceImpl extends EgovAbstractServiceImpl implements HaccpWorkDraftService {

    private final HaccpWorkDAO haccpWorkDAO;

    @Override
    public List<HaccpWorkVO> listMyDraftWorks(String tenantCode, String actorLoginCode) throws Exception {
        String normalizedTenantCode = normalizeTenantCode(tenantCode);
        Long tenantId = resolveTenantId(normalizedTenantCode);
        Long actorLoginId = resolveActorLoginId(tenantId, actorLoginCode);
        Long actorUserId = resolveActorUserId(tenantId, actorLoginId);

        HaccpWorkSearchConditionVO condition = new HaccpWorkSearchConditionVO();
        condition.setTenantCode(normalizedTenantCode);
        condition.setActorLoginId(actorLoginId);
        condition.setActorUserId(actorUserId);
        condition.setActorLoginCode(StringUtils.hasText(actorLoginCode) ? actorLoginCode.trim() : null);
        return haccpWorkDAO.selectMyWorkList(condition);
    }

    @Override
    public HaccpWorkVO getDraftTemplate(String tenantCode, Long id, String idType, String actorLoginCode) throws Exception {
        String normalizedTenantCode = normalizeTenantCode(tenantCode);
        if (id == null || id.longValue() <= 0L) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "조회 ID가 올바르지 않습니다.");
        }

        Long tenantId = resolveTenantId(normalizedTenantCode);
        Long actorLoginId = resolveActorLoginId(tenantId, actorLoginCode);

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("id", id);
        params.put("tenantCode", normalizedTenantCode);
        params.put("actorLoginId", actorLoginId);

        HaccpWorkVO item;
        if ("approval".equalsIgnoreCase(idType)) {
            item = haccpWorkDAO.selectDraftTemplateByApprovalId(params);
        } else {
            item = haccpWorkDAO.selectDraftTemplateByWorkId(params);
        }

        if (item == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "기안 템플릿을 찾을 수 없습니다.");
        }

        return item;
    }

    private Long resolveTenantId(String tenantCode) throws Exception {
        Long tenantId = haccpWorkDAO.selectTenantIdByCode(tenantCode);
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "테넌트를 찾을 수 없습니다: " + tenantCode);
        }
        return tenantId;
    }

    private Long resolveActorLoginId(Long tenantId, String actorLoginCode) throws Exception {
        if (!StringUtils.hasText(actorLoginCode)) {
            return null;
        }

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("loginCode", actorLoginCode.trim());
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
