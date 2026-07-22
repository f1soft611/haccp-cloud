package egovframework.let.documents.haccpwork.service.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.egovframe.rte.fdl.cmmn.EgovAbstractServiceImpl;
import org.egovframe.rte.ptl.mvc.tags.ui.pagination.PaginationInfo;
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
            String workDivisionId,
            String workDivision,
            String draftNumber,
            String title,
            String writer,
            String participantType,
            String status,
            String startDate,
            String endDate
    ) throws Exception {
        HaccpWorkSearchConditionVO condition = buildDocumentSearchCondition(
                tenantCode,
                actorLoginCode,
                actorRoleCode,
                workType,
                workDivisionId,
                workDivision,
                draftNumber,
                title,
                writer,
                participantType,
                status,
                startDate,
                endDate
        );

        condition.setRecordCountPerPage(0);
        condition.setFirstIndex(0);
        return haccpWorkDAO.selectDocumentList(condition);
    }

    @Override
    public Map<String, Object> listDocumentsPaged(
            String tenantCode,
            String actorLoginCode,
            String actorRoleCode,
            String workType,
            String workDivisionId,
            String workDivision,
            String draftNumber,
            String title,
            String writer,
            String participantType,
            String status,
            String startDate,
            String endDate,
            int pageIndex,
            int pageSize
    ) throws Exception {
        HaccpWorkSearchConditionVO condition = buildDocumentSearchCondition(
                tenantCode,
                actorLoginCode,
                actorRoleCode,
                workType,
                workDivisionId,
                workDivision,
                draftNumber,
                title,
                writer,
                participantType,
                status,
                startDate,
                endDate
        );

        int normalizedPageIndex = pageIndex > 0 ? pageIndex : 1;
        int normalizedPageSize = pageSize > 0 ? pageSize : 10;

        condition.setPageIndex(normalizedPageIndex);
        condition.setPageSize(normalizedPageSize);
        condition.setPageUnit(normalizedPageSize);

        PaginationInfo paginationInfo = new PaginationInfo();
        paginationInfo.setCurrentPageNo(condition.getPageIndex());
        paginationInfo.setRecordCountPerPage(condition.getPageSize());
        paginationInfo.setPageSize(condition.getPageSize());

        condition.setFirstIndex(paginationInfo.getFirstRecordIndex());
        condition.setLastIndex(paginationInfo.getLastRecordIndex());
        condition.setRecordCountPerPage(paginationInfo.getRecordCountPerPage());

        List<HaccpWorkVO> resultList = haccpWorkDAO.selectDocumentList(condition);
        int totalCount = haccpWorkDAO.selectDocumentListCount(condition);
        paginationInfo.setTotalRecordCount(totalCount);

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("resultList", resultList);
        resultMap.put("totalCount", totalCount);
        resultMap.put("paginationInfo", paginationInfo);
        return resultMap;
    }

    private HaccpWorkSearchConditionVO buildDocumentSearchCondition(
            String tenantCode,
            String actorLoginCode,
            String actorRoleCode,
            String workType,
            String workDivisionId,
            String workDivision,
            String draftNumber,
            String title,
            String writer,
            String participantType,
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
        condition.setWorkDivisionId(normalizeText(workDivisionId));
        condition.setWorkDivision(normalizeText(workDivision));
        condition.setDraftNumber(normalizeText(draftNumber));
        condition.setTitle(normalizeText(title));
        condition.setWriter(normalizeText(writer));
        List<String> normalizedParticipantTypes = normalizeParticipantTypes(participantType);
        condition.setParticipantTypes(normalizedParticipantTypes);
        condition.setParticipantType(
            normalizedParticipantTypes.isEmpty() ? null : normalizedParticipantTypes.get(0)
        );
        condition.setStatusType(normalizeStatusType(status));
        condition.setStartDate(normalizeDate(startDate));
        condition.setEndDate(normalizeDate(endDate));

        return condition;
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

    private List<String> normalizeParticipantTypes(String participantType) {
        Set<String> normalizedTypes = new LinkedHashSet<String>();
        if (!StringUtils.hasText(participantType)) {
            return new ArrayList<String>();
        }

        String[] tokens = participantType.split(",");
        for (String token : tokens) {
            String normalized = normalizeParticipantType(token);
            if (StringUtils.hasText(normalized)) {
                normalizedTypes.add(normalized);
            }
        }

        return new ArrayList<String>(normalizedTypes);
    }

    private String normalizeParticipantType(String participantType) {
        if (!StringUtils.hasText(participantType)) {
            return null;
        }

        String normalized = participantType.trim().toLowerCase();
        if ("기안자".equals(normalized) || "drafter".equals(normalized) || "owner".equals(normalized)) {
            return "DRAFTER";
        }
        if ("결재자".equals(normalized) || "approver".equals(normalized) || "reviewer".equals(normalized)) {
            return "APPROVER";
        }
        if (
                "참조자".equals(normalized)
                        || "reference".equals(normalized)
                        || "referrer".equals(normalized)
                        || "cooperator".equals(normalized)
        ) {
            return "REFERENCE";
        }
        return null;
    }
}
