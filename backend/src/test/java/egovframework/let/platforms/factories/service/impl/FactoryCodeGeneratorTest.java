package egovframework.let.platforms.factories.service.impl;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class FactoryCodeGeneratorTest {

    @DisplayName("최대 코드가 없으면 000001을 생성한다")
    @Test
    void nextFactoryCodeFromEmpty() {
        assertEquals("000001", FactoryCodeGenerator.nextFactoryCode(null));
    }

    @DisplayName("최대 코드에서 1 증가한 6자리 코드를 생성한다")
    @Test
    void nextFactoryCodeFromExisting() {
        assertEquals("000124", FactoryCodeGenerator.nextFactoryCode("000123"));
    }

    @DisplayName("999999 다음 코드는 생성할 수 없다")
    @Test
    void nextFactoryCodeOverflow() {
        assertThrows(IllegalStateException.class, () -> FactoryCodeGenerator.nextFactoryCode("999999"));
    }
}
