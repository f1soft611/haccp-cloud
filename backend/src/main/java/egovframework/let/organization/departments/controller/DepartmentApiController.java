package egovframework.let.organization.departments.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.EgovUserDetailsHelper;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.let.organization.departments.domain.model.DepartmentSaveRequestVO;
import egovframework.let.organization.departments.domain.model.DepartmentVO;
import egovframework.let.organization.departments.service.DepartmentService;
import lombok.extern.slf4j.Slf4j;

/**
 * 부서 관리를 위한 컨트롤러 클래스
 * @author SHMT-MES
 * @since 2026.07.14
 * @version 1.0
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/departments")
public class DepartmentApiController {

    @Resource(name = "departmentService")
    private DepartmentService departmentService;

    @Resource(name = "resultVoHelper")
    private ResultVoHelper resultVoHelper;

    @GetMapping
    public ResultVO listDepartments(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String active,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        List<DepartmentVO> resultList = departmentService.listDepartments(tenantCode, name, active);

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("resultList", resultList);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResultVO createDepartment(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestBody DepartmentSaveRequestVO payload,
            HttpServletRequest request) throws Exception {
        payload.setTenantCode(resolveTenantCode(tenantHeader, request));
        try {
            DepartmentVO item = departmentService.createDepartment(payload);
            Map<String, Object> resultMap = new HashMap<String, Object>();
            resultMap.put("item", item);
            resultMap.put("message", "부서가 성공적으로 등록되었습니다.");
            return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
        } catch (IllegalArgumentException ex) {
            Map<String, Object> errorMap = new HashMap<String, Object>();
            errorMap.put("message", ex.getMessage());
            return resultVoHelper.buildFromMap(errorMap, ResponseCode.INPUT_CHECK_ERROR);
        }
    }

    @PutMapping("/{id}")
    public ResultVO updateDepartment(
            @PathVariable Long id,
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestBody DepartmentSaveRequestVO payload,
            HttpServletRequest request) throws Exception {
        payload.setTenantCode(resolveTenantCode(tenantHeader, request));
        try {
            DepartmentVO item = departmentService.updateDepartment(id, payload);
            Map<String, Object> resultMap = new HashMap<String, Object>();
            resultMap.put("item", item);
            resultMap.put("message", "부서가 성공적으로 수정되었습니다.");
            return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
        } catch (IllegalArgumentException ex) {
            Map<String, Object> errorMap = new HashMap<String, Object>();
            errorMap.put("message", ex.getMessage());
            return resultVoHelper.buildFromMap(errorMap, ResponseCode.INPUT_CHECK_ERROR);
        }
    }

    @DeleteMapping("/{id}")
    public ResultVO deleteDepartment(
            @PathVariable Long id,
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        departmentService.deleteDepartment(id, tenantCode);

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("message", "부서가 성공적으로 삭제되었습니다.");
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
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
