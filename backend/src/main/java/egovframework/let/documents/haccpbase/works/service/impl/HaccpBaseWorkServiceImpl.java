package egovframework.let.documents.haccpbase.works.service.impl;

import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import javax.annotation.Resource;

import org.egovframe.rte.fdl.cmmn.EgovAbstractServiceImpl;
import org.egovframe.rte.fdl.idgnr.EgovIdGnrService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import egovframework.let.documents.haccpbase.works.domain.model.HaccpBaseWorkSaveRequestVO;
import egovframework.let.documents.haccpbase.works.domain.model.HaccpBaseWorkSearchConditionVO;
import egovframework.let.documents.haccpbase.works.domain.model.HaccpBaseWorkTemplateSaveRequestVO;
import egovframework.let.documents.haccpbase.works.domain.model.HaccpBaseWorkVO;
import egovframework.let.documents.haccpbase.works.domain.repository.HaccpBaseWorkDAO;
import egovframework.let.documents.haccpbase.works.service.HaccpBaseWorkService;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * HACCP 양식 업무 관리를 위한 서비스 구현 클래스
 * @author SHMT-MES
 * @since 2026.07.07
 * @version 1.0
 */
@Service("haccpBaseWorkService")
public class HaccpBaseWorkServiceImpl extends EgovAbstractServiceImpl implements HaccpBaseWorkService {

    private final HaccpBaseWorkDAO haccpBaseWorkDAO;

    @Resource(name = "haccpBaseWorkCodeIdGnrService")
    private EgovIdGnrService haccpBaseWorkCodeIdGnrService;

    @Autowired
    public HaccpBaseWorkServiceImpl(HaccpBaseWorkDAO haccpBaseWorkDAO, EgovIdGnrService haccpBaseWorkCodeIdGnrService) {
        this.haccpBaseWorkDAO = haccpBaseWorkDAO;
        this.haccpBaseWorkCodeIdGnrService = haccpBaseWorkCodeIdGnrService;
    }

    @Override
    public List<HaccpBaseWorkVO> listWorks(String tenantCode, String active) throws Exception {
        String normalizedTenantCode = normalizeTenantCode(tenantCode);
        Long tenantId = resolveTenantId(normalizedTenantCode);

        HaccpBaseWorkSearchConditionVO condition = new HaccpBaseWorkSearchConditionVO();
        condition.setTenantId(tenantId);
        condition.setTenantCode(normalizedTenantCode);
        condition.setActive(normalizeActive(active));
        return haccpBaseWorkDAO.selectWorkList(condition);
    }

    @Override
    public HaccpBaseWorkVO getWorkById(Long id, String tenantCode) throws Exception {
        String normalizedTenantCode = normalizeTenantCode(tenantCode);
        Long tenantId = resolveTenantId(normalizedTenantCode);

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("id", id);
        params.put("tenantId", tenantId);
        params.put("tenantCode", normalizedTenantCode);

        HaccpBaseWorkVO item = haccpBaseWorkDAO.selectWorkById(params);
        if (item == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "업무를 찾을 수 없습니다.");
        }

        return item;
    }

    @Override
    @Transactional
    public HaccpBaseWorkVO createWork(HaccpBaseWorkSaveRequestVO payload, String actorLoginCode) throws Exception {
        String tenantCode = normalizeTenantCode(payload.getTenantCode());
        Long tenantId = resolveTenantId(tenantCode);
        String divisionCode = StringUtils.hasText(payload.getDivisionCode()) ? payload.getDivisionCode().trim() : "";
        if (!StringUtils.hasText(divisionCode)) {
            divisionCode = generateWorkCode();
        }
        payload.setDivisionCode(divisionCode);
        validatePayload(payload);

        Long actorLoginId = resolveActorLoginId(tenantId, actorLoginCode);
        validateWorkCodeDuplication(tenantId, payload.getCategoryGroupId(), divisionCode, null);

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("categoryGroupId", payload.getCategoryGroupId());
        params.put("divisionCode", divisionCode);
        params.put("divisionName", payload.getDivisionName().trim());
        params.put("cycle", normalizeCycle(payload.getCycle()));
        params.put("useAt", Boolean.FALSE.equals(payload.getActive()) ? "N" : "Y");
        params.put("reviewerId", payload.getReviewerId());
        params.put("approverId", payload.getApproverId());
        params.put("createdBy", actorLoginId);
        params.put("updatedBy", actorLoginId);

        Long newId = haccpBaseWorkDAO.insertWork(params);
        saveWorkAuthorityMappings(
            tenantId,
            newId,
            payload.getDivisionCode().trim(),
            payload.getAssigneeIds(),
            actorLoginId
        );

        Map<String, Object> lookupParams = new HashMap<String, Object>();
        lookupParams.put("id", newId);
        lookupParams.put("tenantId", tenantId);
        lookupParams.put("tenantCode", tenantCode);
        return haccpBaseWorkDAO.selectWorkById(lookupParams);
    }

    @Override
    @Transactional
    public HaccpBaseWorkVO updateWork(Long id, HaccpBaseWorkSaveRequestVO payload, String actorLoginCode) throws Exception {
        String tenantCode = normalizeTenantCode(payload.getTenantCode());
        Long tenantId = resolveTenantId(tenantCode);
        String divisionCode = StringUtils.hasText(payload.getDivisionCode()) ? payload.getDivisionCode().trim() : "";
        if (!StringUtils.hasText(divisionCode)) {
            divisionCode = generateWorkCode();
        }
        payload.setDivisionCode(divisionCode);
        validatePayload(payload);

        Long actorLoginId = resolveActorLoginId(tenantId, actorLoginCode);
        validateWorkCodeDuplication(tenantId, payload.getCategoryGroupId(), divisionCode, id);

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("id", id);
        params.put("tenantId", tenantId);
        params.put("categoryGroupId", payload.getCategoryGroupId());
        params.put("divisionCode", divisionCode);
        params.put("divisionName", payload.getDivisionName().trim());
        params.put("cycle", normalizeCycle(payload.getCycle()));
        params.put("useAt", Boolean.FALSE.equals(payload.getActive()) ? "N" : "Y");
        params.put("reviewerId", payload.getReviewerId());
        params.put("approverId", payload.getApproverId());
        params.put("updatedBy", actorLoginId);
        haccpBaseWorkDAO.updateWork(params);

        saveWorkAuthorityMappings(
            tenantId,
            id,
            payload.getDivisionCode().trim(),
            payload.getAssigneeIds(),
            actorLoginId
        );

        Map<String, Object> lookupParams = new HashMap<String, Object>();
        lookupParams.put("id", id);
        lookupParams.put("tenantId", tenantId);
        lookupParams.put("tenantCode", tenantCode);
        HaccpBaseWorkVO item = haccpBaseWorkDAO.selectWorkById(lookupParams);
        if (item == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "업무를 찾을 수 없습니다.");
        }
        return item;
    }

    @Override
    @Transactional
    public HaccpBaseWorkVO saveWorkTemplate(
            Long id,
            String tenantCode,
            HaccpBaseWorkTemplateSaveRequestVO payload,
            String actorLoginCode
    ) throws Exception {
        String normalizedTenantCode = normalizeTenantCode(tenantCode);
        Long tenantId = resolveTenantId(normalizedTenantCode);
        Long actorLoginId = resolveActorLoginId(tenantId, actorLoginCode);

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("id", id);
        params.put("tenantId", tenantId);
        params.put("templateJson", StringUtils.hasText(payload.getTemplateJson()) ? payload.getTemplateJson() : null);
        params.put("templateHtml", StringUtils.hasText(payload.getTemplateHtml()) ? payload.getTemplateHtml() : null);
        params.put("updatedBy", actorLoginId);

        int updatedCount = haccpBaseWorkDAO.updateWorkTemplate(params);
        if (updatedCount == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "업무를 찾을 수 없습니다.");
        }

        Map<String, Object> lookupParams = new HashMap<String, Object>();
        lookupParams.put("id", id);
        lookupParams.put("tenantCode", normalizedTenantCode);
        HaccpBaseWorkVO item = haccpBaseWorkDAO.selectWorkById(lookupParams);
        if (item == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "업무를 찾을 수 없습니다.");
        }

        return item;
    }

    private void validatePayload(HaccpBaseWorkSaveRequestVO payload) {
        if (payload.getCategoryGroupId() == null) {
            throw new IllegalArgumentException("분류는 필수입니다.");
        }
        String divisionCode = payload.getDivisionCode() == null ? "" : payload.getDivisionCode().trim();
        if (divisionCode.length() > 3) {
            throw new IllegalArgumentException("구분코드는 최대 3자리까지 입력할 수 있습니다.");
        }
        if (!StringUtils.hasText(payload.getDivisionName())) {
            throw new IllegalArgumentException("구분명은 필수입니다.");
        }
        if (payload.getDivisionName().trim().length() > 50) {
            throw new IllegalArgumentException("구분명은 최대 50자리까지 입력할 수 있습니다.");
        }
        if (!StringUtils.hasText(payload.getCycle())) {
            throw new IllegalArgumentException("등록주기는 필수입니다.");
        }
        if (payload.getReviewerId() != null && payload.getReviewerId().longValue() <= 0L) {
            throw new IllegalArgumentException("검토자 정보가 올바르지 않습니다.");
        }
        if (payload.getApproverId() != null && payload.getApproverId().longValue() <= 0L) {
            throw new IllegalArgumentException("승인자 정보가 올바르지 않습니다.");
        }

        if (payload.getAssigneeIds() != null) {
            for (String assigneeId : payload.getAssigneeIds()) {
                String normalizedAssigneeId = normalizeAssigneeId(assigneeId);
                if (!StringUtils.hasText(normalizedAssigneeId)) {
                    throw new IllegalArgumentException("담당자 정보가 올바르지 않습니다.");
                }
                if (normalizedAssigneeId.length() > 10) {
                    throw new IllegalArgumentException("담당자 번호는 최대 10자리까지 입력할 수 있습니다.");
                }
            }
        }
    }

    private String generateWorkCode() throws Exception {
        if (haccpBaseWorkCodeIdGnrService == null) {
            throw new IllegalStateException("업무 코드 생성기가 초기화되지 않았습니다.");
        }
        return haccpBaseWorkCodeIdGnrService.getNextStringId();
    }

    private void validateWorkCodeDuplication(Long tenantId, Long categoryGroupId, String divisionCode, Long excludeId) throws Exception {
        Long existingId = haccpBaseWorkDAO.selectWorkIdByCode(tenantId, categoryGroupId, divisionCode);
        if (existingId != null && (excludeId == null || !Objects.equals(excludeId, existingId))) {
            throw new IllegalArgumentException("이미 사용 중인 구분코드입니다.");
        }
    }

    private void saveWorkAuthorityMappings(
            Long tenantId,
            Long workId,
            String cataTypeCode,
            List<String> assigneeIds,
            Long actorLoginId
    ) throws Exception {
        Map<String, Object> deleteParams = new HashMap<String, Object>();
        deleteParams.put("tenantId", tenantId);
        deleteParams.put("workId", workId);
        haccpBaseWorkDAO.deleteWorkAuthorityMappings(deleteParams);

        if (assigneeIds == null || assigneeIds.isEmpty()) {
            return;
        }

        Set<String> uniqueAssigneeIds = new LinkedHashSet<String>();
        for (String assigneeId : assigneeIds) {
            String normalizedAssigneeId = normalizeAssigneeId(assigneeId);
            if (StringUtils.hasText(normalizedAssigneeId)) {
                uniqueAssigneeIds.add(normalizedAssigneeId);
            }
        }

        for (String assigneeId : uniqueAssigneeIds) {
            Map<String, Object> insertParams = new HashMap<String, Object>();
            insertParams.put("tenantId", tenantId);
            insertParams.put("workId", workId);
            insertParams.put("cataTypeCode", cataTypeCode);
            insertParams.put("employeeNo", assigneeId);
            insertParams.put("createdBy", actorLoginId);
            insertParams.put("updatedBy", actorLoginId);
            haccpBaseWorkDAO.insertWorkAuthorityMapping(insertParams);
        }
    }

    private Long resolveTenantId(String tenantCode) throws Exception {
        Long tenantId = haccpBaseWorkDAO.selectTenantIdByCode(tenantCode);
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
        return haccpBaseWorkDAO.selectLoginIdByTenantAndLoginCode(params);
    }

    private String normalizeTenantCode(String tenantCode) {
        return StringUtils.hasText(tenantCode) ? tenantCode.trim().toUpperCase() : "";
    }

    private String normalizeActive(String active) {
        if (!StringUtils.hasText(active)) {
            return null;
        }
        String normalized = active.trim().toUpperCase();
        return ("Y".equals(normalized) || "N".equals(normalized)) ? normalized : null;
    }

    private String normalizeCycle(String cycle) {
        return StringUtils.hasText(cycle) ? cycle.trim() : "";
    }

    private String normalizeAssigneeId(String assigneeId) {
        return StringUtils.hasText(assigneeId) ? assigneeId.trim() : "";
    }
}
