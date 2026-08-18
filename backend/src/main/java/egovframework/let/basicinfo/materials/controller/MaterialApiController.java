package egovframework.let.basicinfo.materials.controller;

import java.util.HashMap;
import java.util.LinkedHashMap;
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
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import egovframework.com.cmm.LoginVO;
import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.EgovUserDetailsHelper;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.let.basicinfo.materials.domain.model.MaterialSaveRequestVO;
import egovframework.let.basicinfo.materials.domain.model.MaterialVO;
import egovframework.let.basicinfo.materials.service.MaterialService;
import lombok.extern.slf4j.Slf4j;

/**
 * 품목 관리를 위한 컨트롤러 클래스
 * @author SHMT-MES
 * @since 2026.08.14
 * @version 1.0
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/basicinfo/materials")
public class MaterialApiController {

    private static final int[] ALLOWED_PAGE_SIZES = {10, 20, 50};

    @Resource(name = "materialService")
    private MaterialService materialService;

    @Resource(name = "resultVoHelper")
    private ResultVoHelper resultVoHelper;

    @GetMapping("/paged")
    public ResultVO listMaterialsPaged(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestParam(defaultValue = "1") int pageIndex,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String keyword,
            HttpServletRequest request) throws Exception {
        validatePage(pageIndex, pageSize);
        String tenantCode = resolveTenantCode(tenantHeader, request);
        Map<String, Object> result = materialService.listMaterialsPaged(pageIndex, pageSize, keyword, tenantCode);

        Map<String, Object> response = new LinkedHashMap<String, Object>();
        response.put("items", result.get("materialList"));
        response.put("totalCount", result.get("totalCount"));
        response.put("paginationInfo", result.get("paginationInfo"));
        return resultVoHelper.buildFromMap(response, ResponseCode.SUCCESS);
    }

    @PostMapping
    public ResultVO createMaterial(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestBody MaterialSaveRequestVO payload,
            HttpServletRequest request) throws Exception {
        payload.setTenantCode(resolveTenantCode(tenantHeader, request));
        applyOperatorContext(payload);
        try {
            MaterialVO item = materialService.createMaterial(payload);
            Map<String, Object> resultMap = new HashMap<String, Object>();
            resultMap.put("item", item);
            resultMap.put("message", "품목이 성공적으로 등록되었습니다.");
            return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
        } catch (IllegalArgumentException ex) {
            Map<String, Object> errorMap = new HashMap<String, Object>();
            errorMap.put("message", ex.getMessage());
            return resultVoHelper.buildFromMap(errorMap, ResponseCode.INPUT_CHECK_ERROR);
        }
    }

    @PutMapping("/{id}")
    public ResultVO updateMaterial(
            @PathVariable Long id,
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestBody MaterialSaveRequestVO payload,
            HttpServletRequest request) throws Exception {
        payload.setTenantCode(resolveTenantCode(tenantHeader, request));
        applyOperatorContext(payload);
        try {
            MaterialVO item = materialService.updateMaterial(id, payload);
            Map<String, Object> resultMap = new HashMap<String, Object>();
            resultMap.put("item", item);
            resultMap.put("message", "품목이 성공적으로 수정되었습니다.");
            return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
        } catch (IllegalArgumentException ex) {
            Map<String, Object> errorMap = new HashMap<String, Object>();
            errorMap.put("message", ex.getMessage());
            return resultVoHelper.buildFromMap(errorMap, ResponseCode.INPUT_CHECK_ERROR);
        }
    }

    @DeleteMapping("/{id}")
    public ResultVO deleteMaterial(
            @PathVariable Long id,
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        materialService.deleteMaterial(id, tenantCode);

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("message", "품목이 성공적으로 삭제되었습니다.");
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    // ── 헬퍼 ─────────────────────────────────────────

    private void validatePage(int pageIndex, int pageSize) {
        if (pageIndex < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "pageIndex는 1 이상이어야 합니다.");
        }
        for (int allowed : ALLOWED_PAGE_SIZES) {
            if (pageSize == allowed) {
                return;
            }
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "pageSize는 10, 20, 50만 허용됩니다.");
    }

    private void applyOperatorContext(MaterialSaveRequestVO payload) {
        try {
            Object userDetails = EgovUserDetailsHelper.getAuthenticatedUser();
            if (userDetails instanceof LoginVO) {
                LoginVO loginVO = (LoginVO) userDetails;
                payload.setOperatorTenantId(loginVO.getTenantId());
                payload.setOperatorLoginCode(loginVO.getId());
            }
        } catch (RuntimeException ex) {
            log.debug("인증 컨텍스트 없음, 작업자 정보 미설정: {}", ex.getMessage());
        }
    }

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
