package egovframework.let.basicinfo.equipment.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;

import org.egovframe.rte.fdl.cmmn.EgovAbstractServiceImpl;
import org.egovframe.rte.ptl.mvc.tags.ui.pagination.PaginationInfo;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import egovframework.let.basicinfo.equipment.domain.model.EquipmentSaveRequestVO;
import egovframework.let.basicinfo.equipment.domain.model.EquipmentSearchConditionVO;
import egovframework.let.basicinfo.equipment.domain.model.EquipmentVO;
import egovframework.let.basicinfo.equipment.domain.repository.EquipmentDAO;
import egovframework.let.basicinfo.equipment.service.EquipmentService;

/**
 * 설비 관리를 위한 서비스 구현 클래스
 * @author SHMT-MES
 * @since 2026.08.14
 * @version 1.0
 */
@Service("equipmentService")
public class EquipmentServiceImpl extends EgovAbstractServiceImpl implements EquipmentService {

    private static final int MAX_EQUIP_SYS_CD = 999999;

    @Resource(name = "equipmentDAO")
    private EquipmentDAO equipmentDAO;

    @Override
    public Map<String, Object> listEquipmentPaged(int pageIndex, int pageSize, String keyword, String filterActive, String tenantCode) throws Exception {
        EquipmentSearchConditionVO condition = new EquipmentSearchConditionVO();
        condition.setPageIndex(pageIndex);
        condition.setPageSize(pageSize);
        condition.setKeyword(normalizeNullable(keyword));
        condition.setFilterActive(normalizeFilterActive(filterActive));
        condition.setTenantCode(normalizeTenantCode(tenantCode));

        PaginationInfo paginationInfo = new PaginationInfo();
        paginationInfo.setCurrentPageNo(condition.getPageIndex());
        paginationInfo.setRecordCountPerPage(condition.getPageSize());
        paginationInfo.setPageSize(condition.getPageSize());

        condition.setFirstIndex(paginationInfo.getFirstRecordIndex());
        condition.setLastIndex(paginationInfo.getLastRecordIndex());
        condition.setRecordCountPerPage(paginationInfo.getRecordCountPerPage());

        List<EquipmentVO> equipmentList = equipmentDAO.selectEquipmentPagedList(condition);
        int totalCount = equipmentDAO.selectEquipmentPagedCount(condition);
        paginationInfo.setTotalRecordCount(totalCount);

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("equipmentList", equipmentList);
        resultMap.put("totalCount", totalCount);
        resultMap.put("paginationInfo", paginationInfo);
        return resultMap;
    }

    @Override
    @Transactional
    public EquipmentVO createEquipment(EquipmentSaveRequestVO payload) throws Exception {
        String tenantCode = normalizeTenantCode(payload.getTenantCode());
        validateRequired(payload);

        Long tenantId = resolveTenantId(tenantCode);

        // 테넌트 단위로 잠금을 건 뒤 최대 관리코드를 조회해 다음 코드를 채번한다(동시 등록 시 코드 중복 방지).
        equipmentDAO.lockTenantForCodeGeneration(tenantId);
        String nextEquipSysCd = generateNextEquipSysCd(equipmentDAO.selectMaxEquipSysCd(tenantId));

        String operatorUserId = resolveOperatorUserId(payload);

        Map<String, Object> params = buildParams(payload);
        params.put("tenantId", tenantId);
        params.put("equipSysCd", nextEquipSysCd);
        params.put("useAt", Boolean.FALSE.equals(payload.getActive()) ? "N" : "Y");
        params.put("createdBy", operatorUserId);
        params.put("updatedBy", operatorUserId);

        Long newId = equipmentDAO.insertEquipment(params);

        Map<String, Object> lookupParams = new HashMap<String, Object>();
        lookupParams.put("equipmentId", newId);
        lookupParams.put("tenantId", tenantId);
        return equipmentDAO.selectEquipmentById(lookupParams);
    }

    @Override
    @Transactional
    public EquipmentVO updateEquipment(Long equipmentId, EquipmentSaveRequestVO payload) throws Exception {
        String tenantCode = normalizeTenantCode(payload.getTenantCode());
        validateRequired(payload);

        Long tenantId = resolveTenantId(tenantCode);

        Map<String, Object> params = buildParams(payload);
        params.put("equipmentId", equipmentId);
        params.put("tenantId", tenantId);
        params.put("useAt", Boolean.FALSE.equals(payload.getActive()) ? "N" : "Y");
        params.put("updatedBy", resolveOperatorUserId(payload));
        equipmentDAO.updateEquipment(params);

        Map<String, Object> lookupParams = new HashMap<String, Object>();
        lookupParams.put("equipmentId", equipmentId);
        lookupParams.put("tenantId", tenantId);
        EquipmentVO updated = equipmentDAO.selectEquipmentById(lookupParams);
        if (updated == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "설비를 찾을 수 없습니다.");
        }
        return updated;
    }

    @Override
    @Transactional
    public void deleteEquipment(Long equipmentId, String tenantCode) throws Exception {
        Long tenantId = resolveTenantId(normalizeTenantCode(tenantCode));

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("equipmentId", equipmentId);
        params.put("tenantId", tenantId);
        equipmentDAO.deleteEquipment(params);
    }

    // ── 헬퍼 ─────────────────────────────────────────

    private void validateRequired(EquipmentSaveRequestVO payload) {
        if (!StringUtils.hasText(payload.getEquipCd())) {
            throw new IllegalArgumentException("설비코드는 필수입니다.");
        }
        if (!StringUtils.hasText(payload.getEquipNm())) {
            throw new IllegalArgumentException("설비명은 필수입니다.");
        }
    }

    private Map<String, Object> buildParams(EquipmentSaveRequestVO payload) {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("equipCd", payload.getEquipCd().trim());
        params.put("equipNm", payload.getEquipNm().trim());
        params.put("equipKind", normalizeNullable(payload.getEquipKind()));
        params.put("purDate", normalizeNullable(payload.getPurDate()));
        params.put("purCust", normalizeNullable(payload.getPurCust()));
        params.put("makCust", normalizeNullable(payload.getMakCust()));
        params.put("equipSpec", normalizeNullable(payload.getEquipSpec()));
        params.put("location", normalizeNullable(payload.getLocation()));
        params.put("bigo", normalizeNullable(payload.getBigo()));
        return params;
    }

    private String generateNextEquipSysCd(String maxCode) {
        int next = 1;
        if (StringUtils.hasText(maxCode)) {
            try {
                next = Integer.parseInt(maxCode.trim()) + 1;
            } catch (NumberFormatException ex) {
                next = 1;
            }
        }
        if (next > MAX_EQUIP_SYS_CD) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "관리코드 채번 가능 범위를 초과했습니다.");
        }
        return String.format("%06d", next);
    }

    private String resolveOperatorUserId(EquipmentSaveRequestVO payload) throws Exception {
        if (payload.getOperatorTenantId() == null || !StringUtils.hasText(payload.getOperatorLoginCode())) {
            return null;
        }
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", payload.getOperatorTenantId());
        params.put("loginCode", payload.getOperatorLoginCode().trim());
        Long userId = equipmentDAO.selectUserIdByLoginCode(params);
        return userId != null ? String.valueOf(userId) : null;
    }

    private Long resolveTenantId(String tenantCode) throws Exception {
        Long tenantId = equipmentDAO.selectTenantIdByCode(tenantCode);
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "테넌트를 찾을 수 없습니다: " + tenantCode);
        }
        return tenantId;
    }

    private String normalizeTenantCode(String tenantCode) {
        return StringUtils.hasText(tenantCode) ? tenantCode.trim().toUpperCase() : "";
    }

    private String normalizeNullable(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String normalizeFilterActive(String filterActive) {
        if (!StringUtils.hasText(filterActive)) {
            return "all";
        }
        String upper = filterActive.trim().toUpperCase();
        return ("Y".equals(upper) || "N".equals(upper)) ? upper : "all";
    }
}
