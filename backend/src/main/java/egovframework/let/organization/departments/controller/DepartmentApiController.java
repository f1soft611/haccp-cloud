package egovframework.let.organization.departments.controller;

import java.util.List;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import egovframework.com.cmm.LoginVO;
import egovframework.com.cmm.util.EgovUserDetailsHelper;
import egovframework.let.organization.departments.domain.model.DepartmentSaveRequestVO;
import egovframework.let.organization.departments.domain.model.DepartmentVO;
import egovframework.let.organization.departments.service.DepartmentService;
import lombok.extern.slf4j.Slf4j;

/**
 * 부서 관리 API 컨트롤러
 * - GET    /api/v1/departments           목록 조회 (검색 파라미터: name, active)
 * - POST   /api/v1/departments           부서 등록
 * - PUT    /api/v1/departments/{id}      부서 수정
 * - DELETE /api/v1/departments/{id}      부서 삭제
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/departments")
public class DepartmentApiController {

    @Resource(name = "departmentService")
    private DepartmentService departmentService;

    @GetMapping
    public List<DepartmentVO> listDepartments(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String active,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        return departmentService.listDepartments(tenantCode, name, active);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DepartmentVO createDepartment(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestBody DepartmentSaveRequestVO payload,
            HttpServletRequest request) throws Exception {
        payload.setTenantCode(resolveTenantCode(tenantHeader, request));
        try {
            return departmentService.createDepartment(payload);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @PutMapping("/{id}")
    public DepartmentVO updateDepartment(
            @PathVariable Long id,
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestBody DepartmentSaveRequestVO payload,
            HttpServletRequest request) throws Exception {
        payload.setTenantCode(resolveTenantCode(tenantHeader, request));
        try {
            return departmentService.updateDepartment(id, payload);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDepartment(
            @PathVariable Long id,
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        departmentService.deleteDepartment(id, tenantCode);
    }

    // ── 헬퍼 ─────────────────────────────────────────

    private String resolveTenantCode(String tenantHeader, HttpServletRequest request) {
        if (StringUtils.hasText(tenantHeader)) {
            return tenantHeader.trim().toUpperCase();
        }
        try {
            Object userDetails = EgovUserDetailsHelper.getAuthenticatedUser();
            if (userDetails instanceof LoginVO) {
                LoginVO loginVO = (LoginVO) userDetails;
                if (StringUtils.hasText(loginVO.getTenantCode())) {
                    return loginVO.getTenantCode().trim().toUpperCase();
                }
            }
        } catch (RuntimeException ex) {
            log.debug("인증 컨텍스트 없음, tenantHeader 사용: {}", ex.getMessage());
        }
        return "";
    }
}
