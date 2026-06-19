package egovframework.let.uss.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class AuthorityInfoDescriptionFieldTest {

    @DisplayName("권한 설명 필드를 보관할 수 있다")
    @Test
    void storeAuthorityDescription() {
        AuthorityInfoVO target = new AuthorityInfoVO();
        target.setAuthorityDc("품질 승인 권한");

        assertEquals("품질 승인 권한", target.getAuthorityDc());
    }
}