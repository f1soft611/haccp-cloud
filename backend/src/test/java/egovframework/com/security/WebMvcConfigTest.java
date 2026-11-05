package egovframework.com.security;

import static org.junit.jupiter.api.Assertions.assertFalse;

import java.util.Arrays;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Bean;
import org.springframework.http.converter.HttpMessageConverter;

class WebMvcConfigTest {

    @DisplayName("응답 문자열을 바꾸는 메시지 컨버터를 빈으로 등록하지 않는다")
    @Test
    void doesNotRegisterMessageConverterBean() {
        boolean registered = Arrays.stream(WebMvcConfig.class.getDeclaredMethods())
                .anyMatch(method -> method.isAnnotationPresent(Bean.class)
                        && HttpMessageConverter.class.isAssignableFrom(method.getReturnType()));

        assertFalse(registered);
    }
}