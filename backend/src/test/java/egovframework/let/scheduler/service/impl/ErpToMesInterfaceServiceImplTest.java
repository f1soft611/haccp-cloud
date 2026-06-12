package egovframework.let.scheduler.service.impl;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ErpToMesInterfaceServiceImplTest {

    @Test
    @DisplayName("ReqDate 비교용 날짜는 yyyyMMdd로 정규화한다")
    void normalizeReqDateParam_removesHyphen() {
        assertThat(ErpToMesInterfaceServiceImpl.normalizeReqDateParam("2026-06-08")).isEqualTo("20260608");
    }

    @Test
    @DisplayName("ReqDate 비교용 날짜가 이미 yyyyMMdd면 그대로 유지한다")
    void normalizeReqDateParam_keepsCompactDate() {
        assertThat(ErpToMesInterfaceServiceImpl.normalizeReqDateParam("20260608")).isEqualTo("20260608");
    }
}
