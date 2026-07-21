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
    public List<HaccpWorkVO> listDocuments(
            String tenantCode,
            String actorLoginCode,
            String actorRoleCode,
            String workType,
            String draftNumber,
            String title,
            String writer,
            String status,
            String startDate,
            String endDate
    ) throws Exception {
        String normalizedTenantCode = normalizeTenantCode(tenantCode);
        Long tenantId = resolveTenantId(normalizedTenantCode);
        Long actorLoginId = resolveActorLoginId(tenantId, actorLoginCode);
        Long actorUserId = resolveActorUserId(tenantId, actorLoginId);

        HaccpWorkSearchConditionVO condition = new HaccpWorkSearchConditionVO();
        condition.setTenantCode(normalizedTenantCode);
        condition.setActorLoginId(actorLoginId);
        condition.setActorUserId(actorUserId);
        condition.setActorLoginCode(normalizeText(actorLoginCode));
        condition.setActorRoleCode(normalizeRoleCode(actorRoleCode));
        condition.setWorkType(normalizeText(workType));
        condition.setDraftNumber(normalizeText(draftNumber));
        condition.setTitle(normalizeText(title));
        condition.setWriter(normalizeText(writer));
        condition.setStatusType(normalizeStatusType(status));
        condition.setStartDate(normalizeDate(startDate));
        condition.setEndDate(normalizeDate(endDate));

        return haccpWorkDAO.selectDocumentList(condition);
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
            ensureApprovalTemplateAccess(tenantId, id, actorLoginId);
            item = haccpWorkDAO.selectDraftTemplateByApprovalId(params);
        } else {
            ensureWorkTemplateAccess(tenantId, id, actorLoginId);
            item = haccpWorkDAO.selectDraftTemplateByWorkId(params);
        }

        if (item == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "기안 템플릿을 찾을 수 없습니다.");
        }

        return item;
    }

    private void ensureWorkTemplateAccess(Long tenantId, Long workId, Long actorLoginId) throws Exception {
        if (tenantId == null || workId == null || actorLoginId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "템플릿 조회 권한이 없습니다.");
        }

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("workId", workId);
        params.put("actorLoginId", actorLoginId);

        Integer accessCount = haccpWorkDAO.selectWorkAssigneeAccessCount(params);
        if (accessCount == null || accessCount.intValue() <= 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "담당자만 템플릿을 조회할 수 있습니다.");
        }
    }

    private void ensureApprovalTemplateAccess(Long tenantId, Long approvalId, Long actorLoginId) throws Exception {
        if (tenantId == null || approvalId == null || actorLoginId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "결재 문서 조회 권한이 없습니다.");
        }

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("approvalId", approvalId);
        params.put("actorLoginId", actorLoginId);

        Integer accessCount = haccpWorkDAO.selectApprovalTemplateAccessCount(params);
        if (accessCount == null || accessCount.intValue() <= 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "결재 참여자만 문서를 조회할 수 있습니다.");
        }
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

    private String normalizeText(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String normalizeRoleCode(String roleCode) {
        return StringUtils.hasText(roleCode) ? roleCode.trim().toUpperCase() : "";
    }

    private String normalizeDate(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        String normalized = value.trim();
        if (!normalized.matches("^\\d{4}-\\d{2}-\\d{2}$")) {
            return null;
        }
        return normalized;
    }

    private String normalizeStatusType(String status) {
        if (!StringUtils.hasText(status)) {
            return null;
        }

        String normalized = status.trim().toLowerCase();
        if ("결재중".equals(normalized) || "in_progress".equals(normalized)) {
            return "in_progress";
        }
        if ("승인".equals(normalized) || "approved".equals(normalized)) {
            return "approved";
        }
        if (
                "반송".equals(normalized)
                        || "반려".equals(normalized)
                        || "rejected".equals(normalized)
                        || "returned".equals(normalized)
        ) {
            return "rejected";
        }
        if (
                "임시저장".equals(normalized)
                        || "미완료".equals(normalized)
                        || "pre_apply".equals(normalized)
                        || "draft".equals(normalized)
        ) {
            return "pre_apply";
        }
        return null;
    }
}
