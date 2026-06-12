package egovframework.let.uat.loginhistory.service.impl;

/**
 * 정부 로그 API 응답코드 판정 유틸리티
 */
public final class GovLogResponseCodeEvaluator {

    private GovLogResponseCodeEvaluator() {
    }

    public static boolean isSuccessCode(String responseCode) {
        if (responseCode == null) {
            return false;
        }
        String code = responseCode.trim();
        return "AP1001".equals(code) || "AP1002".equals(code);
    }
}
