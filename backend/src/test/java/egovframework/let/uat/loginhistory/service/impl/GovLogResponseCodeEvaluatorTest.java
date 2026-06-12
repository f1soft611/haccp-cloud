package egovframework.let.uat.loginhistory.service.impl;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GovLogResponseCodeEvaluatorTest {

    @Test
    @DisplayName("정부 응답코드 AP1001, AP1002는 성공으로 판정한다")
    void isSuccessCode_true() {
        assertThat(GovLogResponseCodeEvaluator.isSuccessCode("AP1001")).isTrue();
        assertThat(GovLogResponseCodeEvaluator.isSuccessCode("AP1002")).isTrue();
    }

    @Test
    @DisplayName("정부 응답코드 AP10xx 및 공백은 실패로 판정한다")
    void isSuccessCode_false() {
        assertThat(GovLogResponseCodeEvaluator.isSuccessCode("AP1010")).isFalse();
        assertThat(GovLogResponseCodeEvaluator.isSuccessCode(" ")).isFalse();
        assertThat(GovLogResponseCodeEvaluator.isSuccessCode(null)).isFalse();
    }
}
