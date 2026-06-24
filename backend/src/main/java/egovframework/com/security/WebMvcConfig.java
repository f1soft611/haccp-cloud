package egovframework.com.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.fasterxml.jackson.databind.ObjectMapper;

import egovframework.com.config.HtmlCharacterEscapes;
import egovframework.let.platforms.access.web.PlanAccessInterceptor;
import lombok.RequiredArgsConstructor;

import java.util.List;

/**
 * fileName       : WebMvcConfig
 * author         : crlee
 * date           : 2023/07/13
 * description    :
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 2023/07/13        crlee       최초 생성
 */
@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {
	
	private final ObjectMapper objectMapper;
    private final PlanAccessInterceptor planAccessInterceptor;
	
    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> argumentResolvers) {
        argumentResolvers.add(new CustomAuthenticationPrincipalResolver());
    }

    @Override
    public void addInterceptors(org.springframework.web.servlet.config.annotation.InterceptorRegistry registry) {
        registry.addInterceptor(planAccessInterceptor)
            .addPathPatterns("/api/**", "/members/**")
            .excludePathPatterns(
                "/api/auth/**",
                "/api/v1/tenants/onboarding/**",
                "/api/tenants/onboarding/**",
                "/api/first-login-setup/**"
            );
    }
    
    @Bean
    public HttpMessageConverter<?> htmlEscapingConverter() {
        ObjectMapper copy = objectMapper.copy();
        copy.getFactory().setCharacterEscapes(new HtmlCharacterEscapes());
        return new MappingJackson2HttpMessageConverter(copy);
    }
    
}