package egovframework.let.organization.departments.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;

import org.egovframe.rte.fdl.cmmn.EgovAbstractServiceImpl;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import egovframework.let.organization.departments.domain.model.DepartmentSaveRequestVO;
import egovframework.let.organization.departments.domain.model.DepartmentSearchConditionVO;
import egovframework.let.organization.departments.domain.model.DepartmentVO;
import egovframework.let.organization.departments.domain.repository.DepartmentDAO;
import egovframework.let.organization.departments.service.DepartmentService;

/**
 * 부서 관리를 위한 서비스 구현 클래스
 * @author SHMT-MES
 * @since 2026.07.14
 * @version 1.0
 */
@Service("departmentService")
public class DepartmentServiceImpl extends EgovAbstractServiceImpl implements DepartmentService {

    @Resource(name = "departmentDAO")
    private DepartmentDAO departmentDAO;

    @Override
    public List<DepartmentVO> listDepartments(String tenantCode, String name, String active) throws Exception {
        String normalizedTenantCode = normalizeTenantCode(tenantCode);
        Long tenantId = resolveTenantId(normalizedTenantCode);

        DepartmentSearchConditionVO condition = new DepartmentSearchConditionVO();
        condition.setTenantId(tenantId);
        condition.setTenantCode(normalizedTenantCode);
        condition.setName(normalizeNullable(name));
        condition.setActive(normalizeActive(active));
        return departmentDAO.selectDepartmentList(condition);
    }

    @Override
    @Transactional
    public DepartmentVO createDepartment(DepartmentSaveRequestVO payload) throws Exception {
        String tenantCode = normalizeTenantCode(payload.getTenantCode());
        if (!StringUtils.hasText(payload.getName())) {
            throw new IllegalArgumentException("부서명은 필수입니다.");
        }

        Long tenantId = resolveTenantId(tenantCode);

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("tenantCode", tenantCode);
        params.put("departmentNm", payload.getName().trim());
        params.put("parentDepartmentId", payload.getParentId());
        params.put("sortOrder", payload.getSortOrder());

        Long newId = departmentDAO.insertDepartment(params);

        Map<String, Object> lookupParams = new HashMap<String, Object>();
        lookupParams.put("departmentId", newId);
        lookupParams.put("tenantId", tenantId);
        lookupParams.put("tenantCode", tenantCode);
        return departmentDAO.selectDepartmentById(lookupParams);
    }

    @Override
    @Transactional
    public DepartmentVO updateDepartment(Long departmentId, DepartmentSaveRequestVO payload) throws Exception {
        String tenantCode = normalizeTenantCode(payload.getTenantCode());
        if (!StringUtils.hasText(payload.getName())) {
            throw new IllegalArgumentException("부서명은 필수입니다.");
        }

        Long tenantId = resolveTenantId(tenantCode);

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("departmentId", departmentId);
        params.put("tenantId", tenantId);
        params.put("departmentNm", payload.getName().trim());
        params.put("parentDepartmentId", payload.getParentId());
        params.put("sortOrder", payload.getSortOrder());
        params.put("useAt", Boolean.FALSE.equals(payload.getActive()) ? "N" : "Y");
        departmentDAO.updateDepartment(params);

        Map<String, Object> lookupParams = new HashMap<String, Object>();
        lookupParams.put("departmentId", departmentId);
        lookupParams.put("tenantId", tenantId);
        lookupParams.put("tenantCode", tenantCode);
        return departmentDAO.selectDepartmentById(lookupParams);
    }

    @Override
    @Transactional
    public void deleteDepartment(Long departmentId, String tenantCode) throws Exception {
        String normalizedCode = normalizeTenantCode(tenantCode);
        Long tenantId = resolveTenantId(normalizedCode);

        Map<String, Object> checkParams = new HashMap<String, Object>();
        checkParams.put("departmentId", departmentId);
        checkParams.put("tenantId", tenantId);

        int childCount = departmentDAO.countChildDepartments(checkParams);
        if (childCount > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "하위 부서가 있어 삭제할 수 없습니다.");
        }

        Map<String, Object> deleteParams = new HashMap<String, Object>();
        deleteParams.put("departmentId", departmentId);
        deleteParams.put("tenantId", tenantId);
        departmentDAO.deleteDepartment(deleteParams);
    }

    // ── 헬퍼 ─────────────────────────────────────────

    private Long resolveTenantId(String tenantCode) throws Exception {
        Long tenantId = departmentDAO.selectTenantIdByCode(tenantCode);
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

    private String normalizeActive(String active) {
        if (!StringUtils.hasText(active)) return null;
        String upper = active.trim().toUpperCase();
        return ("Y".equals(upper) || "N".equals(upper)) ? upper : null;
    }
}
