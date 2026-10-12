package egovframework.let.basicinfo.commoncode.controller;

import java.util.HashMap;
import java.util.Map;

import javax.annotation.Resource;

import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import egovframework.com.cmm.LoginVO;
import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.EgovUserDetailsHelper;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.let.basicinfo.commoncode.domain.model.CommonCodeSaveRequestVO;
import egovframework.let.basicinfo.commoncode.service.CommonCodeService;
import lombok.extern.slf4j.Slf4j;

/**
 * 공통코드 관리를 위한 컨트롤러 클래스
 * @author SHMT-MES
 * @since 2026.10.08
 * @version 1.0
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/basicinfo/common-codes")
public class CommonCodeApiController {

    @Resource(name = "commonCodeService")
    private CommonCodeService commonCodeService;

    @Resource(name = "resultVoHelper")
    private ResultVoHelper resultVoHelper;

    @GetMapping
    public ResultVO getCommonCodes(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader) throws Exception {
        Map<String, Object> result = commonCodeService.getCommonCodes(resolveTenantCode(tenantHeader));
        return resultVoHelper.buildFromMap(result, ResponseCode.SUCCESS);
    }

    @PutMapping
    public ResultVO saveCommonCodes(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @RequestBody CommonCodeSaveRequestVO payload) throws Exception {
        payload.setTenantCode(resolveTenantCode(tenantHeader));
        applyOperatorContext(payload);
        Map<String, Object> resultMap = new HashMap<String, Object>();
        try {
            commonCodeService.saveCommonCodes(payload);
            resultMap.put("message", "저장되었습니다.");
            return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
        } catch (IllegalArgumentException ex) {
            resultMap.put("message", ex.getMessage());
            return resultVoHelper.buildFromMap(resultMap, ResponseCode.INPUT_CHECK_ERROR);
        }
    }

    // ── 헬퍼 ─────────────────────────────────────────

    private void applyOperatorContext(CommonCodeSaveRequestVO payload) {
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

    private String resolveTenantCode(String tenantHeader) {
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