package egovframework.let.basicinfo.materials.service.impl;

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

import egovframework.let.basicinfo.materials.domain.model.MaterialSaveRequestVO;
import egovframework.let.basicinfo.materials.domain.model.MaterialSearchConditionVO;
import egovframework.let.basicinfo.materials.domain.model.MaterialVO;
import egovframework.let.basicinfo.materials.domain.repository.MaterialDAO;
import egovframework.let.basicinfo.materials.service.MaterialService;

/**
 * 품목 관리를 위한 서비스 구현 클래스
 * @author SHMT-MES
 * @since 2026.08.14
 * @version 1.0
 */
@Service("materialService")
public class MaterialServiceImpl extends EgovAbstractServiceImpl implements MaterialService {

    private static final int MAX_MATERIAL_CODE = 999999;

    @Resource(name = "materialDAO")
    private MaterialDAO materialDAO;

    @Override
    public Map<String, Object> listMaterialsPaged(int pageIndex, int pageSize, String keyword, String tenantCode) throws Exception {
        MaterialSearchConditionVO condition = new MaterialSearchConditionVO();
        condition.setPageIndex(pageIndex);
        condition.setPageSize(pageSize);
        condition.setKeyword(normalizeNullable(keyword));
        condition.setTenantCode(normalizeTenantCode(tenantCode));

        PaginationInfo paginationInfo = new PaginationInfo();
        paginationInfo.setCurrentPageNo(condition.getPageIndex());
        paginationInfo.setRecordCountPerPage(condition.getPageSize());
        paginationInfo.setPageSize(condition.getPageSize());

        condition.setFirstIndex(paginationInfo.getFirstRecordIndex());
        condition.setLastIndex(paginationInfo.getLastRecordIndex());
        condition.setRecordCountPerPage(paginationInfo.getRecordCountPerPage());

        List<MaterialVO> materialList = materialDAO.selectMaterialPagedList(condition);
        int totalCount = materialDAO.selectMaterialPagedCount(condition);
        paginationInfo.setTotalRecordCount(totalCount);

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("materialList", materialList);
        resultMap.put("totalCount", totalCount);
        resultMap.put("paginationInfo", paginationInfo);
        return resultMap;
    }

    @Override
    @Transactional
    public MaterialVO createMaterial(MaterialSaveRequestVO payload) throws Exception {
        String tenantCode = normalizeTenantCode(payload.getTenantCode());
        if (!StringUtils.hasText(payload.getMaterialName())) {
            throw new IllegalArgumentException("품목명은 필수입니다.");
        }

        Long tenantId = resolveTenantId(tenantCode);

        // 테넌트 단위로 잠금을 건 뒤 최대 코드를 조회해 다음 코드를 채번한다(동시 등록 시 코드 중복 방지).
        materialDAO.lockTenantForCodeGeneration(tenantId);
        String nextMaterialCode = generateNextMaterialCode(materialDAO.selectMaxMaterialCode(tenantId));

        String operatorUserId = resolveOperatorUserId(payload);

        Map<String, Object> params = buildParams(payload);
        params.put("tenantId", tenantId);
        params.put("materialCode", nextMaterialCode);
        params.put("createdBy", operatorUserId);
        params.put("updatedBy", operatorUserId);

        Long newId = materialDAO.insertMaterial(params);

        Map<String, Object> lookupParams = new HashMap<String, Object>();
        lookupParams.put("materialId", newId);
        lookupParams.put("tenantId", tenantId);
        return materialDAO.selectMaterialById(lookupParams);
    }

    @Override
    @Transactional
    public MaterialVO updateMaterial(Long materialId, MaterialSaveRequestVO payload) throws Exception {
        String tenantCode = normalizeTenantCode(payload.getTenantCode());
        if (!StringUtils.hasText(payload.getMaterialName())) {
            throw new IllegalArgumentException("품목명은 필수입니다.");
        }

        Long tenantId = resolveTenantId(tenantCode);

        Map<String, Object> params = buildParams(payload);
        params.put("materialId", materialId);
        params.put("tenantId", tenantId);
        params.put("updatedBy", resolveOperatorUserId(payload));
        materialDAO.updateMaterial(params);

        Map<String, Object> lookupParams = new HashMap<String, Object>();
        lookupParams.put("materialId", materialId);
        lookupParams.put("tenantId", tenantId);
        MaterialVO updated = materialDAO.selectMaterialById(lookupParams);
        if (updated == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "품목을 찾을 수 없습니다.");
        }
        return updated;
    }

    @Override
    @Transactional
    public void deleteMaterial(Long materialId, String tenantCode) throws Exception {
        Long tenantId = resolveTenantId(normalizeTenantCode(tenantCode));

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("materialId", materialId);
        params.put("tenantId", tenantId);
        materialDAO.softDeleteMaterial(params);
    }

    // ── 헬퍼 ─────────────────────────────────────────

    private Map<String, Object> buildParams(MaterialSaveRequestVO payload) {
        String itemType = normalizeNullable(payload.getItemType());

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("materialName", payload.getMaterialName().trim());
        params.put("itemType", itemType);
        // material_type_code는 NOT NULL 컬럼이며, 향후 공통코드 연동 전까지 item_type 텍스트를 그대로 채운다.
        params.put("materialTypeCode", itemType != null ? itemType : "");
        params.put("materialSpec", normalizeNullable(payload.getMaterialSpec()));
        params.put("materialWeight", payload.getMaterialWeight());
        params.put("unit", normalizeNullable(payload.getUnit()));
        params.put("etc", normalizeNullable(payload.getEtc()));
        return params;
    }

    private String generateNextMaterialCode(String maxCode) {
        int next = 1;
        if (StringUtils.hasText(maxCode)) {
            try {
                next = Integer.parseInt(maxCode.trim()) + 1;
            } catch (NumberFormatException ex) {
                next = 1;
            }
        }
        if (next > MAX_MATERIAL_CODE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "품목코드 채번 가능 범위를 초과했습니다.");
        }
        return String.format("%06d", next);
    }

    private String resolveOperatorUserId(MaterialSaveRequestVO payload) throws Exception {
        if (payload.getOperatorTenantId() == null || !StringUtils.hasText(payload.getOperatorLoginCode())) {
            return null;
        }
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", payload.getOperatorTenantId());
        params.put("loginCode", payload.getOperatorLoginCode().trim());
        Long userId = materialDAO.selectUserIdByLoginCode(params);
        return userId != null ? String.valueOf(userId) : null;
    }

    private Long resolveTenantId(String tenantCode) throws Exception {
        Long tenantId = materialDAO.selectTenantIdByCode(tenantCode);
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
}
