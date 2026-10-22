package egovframework.let.documents.haccpwork.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import egovframework.let.documents.haccpwork.domain.model.HaccpWorkApprovalSubVO;

/**
 * HCP 업무(만료일 관리 양식) 기안 sub 검증과 저장 파라미터 변환
 */
public class HaccpWorkApprovalSubs {

    private static final String CALIB = "HCP-CALIB";
    private static final String HCERT = "HCP-HCERT";
    private static final List<String> MATERIAL_CODES = Arrays.asList("HCP-VALID", "HCP-SQI");
    private static final List<String> SUB_CODES = Arrays.asList(CALIB, "HCP-VALID", "HCP-SQI", HCERT);
    private static final DateTimeFormatter STORE_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;

    private HaccpWorkApprovalSubs() {
    }

    /** sub 를 저장하는 HCP 분류코드인지. 4개 코드 외에는 false. */
    static boolean isSubCategory(String categoryCode) {
        return categoryCode != null && SUB_CODES.contains(categoryCode.trim());
    }

    /** 분류코드별 대상, 검사일, 만료일 필수와 날짜 순서를 검증한다. 오류면 400. */
    static void validate(String categoryCode, HaccpWorkApprovalSubVO sub) {
        String code = categoryCode.trim();
        boolean hasTarget = sub != null && (
                CALIB.equals(code) ? sub.getEquipmentId() != null
                        : HCERT.equals(code) ? sub.getCertificationUserId() != null
                          : StringUtils.hasText(sub.getMaterialType()));
        if (!hasTarget
                || !StringUtils.hasText(sub.getInspectedDate())
                || !StringUtils.hasText(sub.getExpirationDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "필수값을 입력하세요.");
        }
        if (parse(sub.getInspectedDate()).isAfter(parse(sub.getExpirationDate()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "만료일은 검사일 이후여야 합니다.");
        }
    }

    /** validate 를 통과한 sub 를 UPDATE, INSERT 파라미터로 바꾼다. 분류코드의 대상 컬럼만 채운다. */
    static Map<String, Object> toParams(
            Long tenantId,
            Long approvalId,
            Long workId,
            String categoryCode,
            HaccpWorkApprovalSubVO sub,
            Long actorLoginId,
            LocalDateTime now
    ) {
        String code = categoryCode.trim();
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("approvalId", approvalId);
        params.put("workId", workId);
        params.put("equipmentId", CALIB.equals(code) ? sub.getEquipmentId() : null);
        params.put("materialType", MATERIAL_CODES.contains(code) ? sub.getMaterialType().trim() : null);
        params.put("certificationUserId", HCERT.equals(code) ? sub.getCertificationUserId() : null);
        params.put("inspectedDate", parse(sub.getInspectedDate()).format(STORE_FORMATTER));
        params.put("expirationDate", parse(sub.getExpirationDate()).format(STORE_FORMATTER));
        params.put("actorLoginId", actorLoginId);
        params.put("now", now);
        return params;
    }

    private static LocalDate parse(String date) {
        try {
            return LocalDate.parse(date.trim());
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "날짜 형식이 올바르지 않습니다.");
        }
    }
}