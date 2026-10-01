package egovframework.com.security;

import egovframework.com.cmm.filter.HTMLTagFilter;
import egovframework.com.jwt.JwtAuthenticationEntryPoint;
import egovframework.com.jwt.JwtAuthenticationFilter;
import egovframework.let.platform_admin.tenants.context.TenantContextFilter;

import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.channel.ChannelProcessingFilter;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.util.unit.DataSize;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CharacterEncodingFilter;
import org.springframework.web.multipart.support.MultipartFilter;

import java.util.Arrays;

import javax.servlet.MultipartConfigElement;

/**
 * fileName : SecurityConfig
 * author : crlee
 * date : 2023/06/10
 * description :
 * ===========================================================
 * DATE AUTHOR NOTE
 * -----------------------------------------------------------
 * 2023/06/10 crlee 최초 생성
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final String CONTENT_SECURITY_POLICY =
        "default-src 'self'; "
            + "base-uri 'self'; "
            + "frame-ancestors 'none'; "
            + "object-src 'none'; "
            + "img-src 'self' https: data:; "
            + "script-src 'self' 'unsafe-inline'; "
            + "style-src 'self' 'unsafe-inline'; "
            + "font-src 'self' https: data:; "
            + "connect-src 'self' https: http:;";

    // Http Methpd : Get 인증예외 List
    private String[] AUTH_GET_WHITELIST = {
            "/mainPage", // 메인 화면 리스트 조회
            "/image", // 갤러리 이미지보기
    };

    // 인증 예외 List
    private String[] AUTH_WHITELIST = {
            "/",
            "/login/**",
            "/api/tenants/**", // 도메인 기반 로그인 페이지 테넌트 정보 조회
            "/api/v1/platform-admin/tenants/domains/**", // 로그인 페이지 도메인 기반 테넌트 조회
            "/api/v1/onboarding/**", // 외부 이메일 인증 링크용 공개 API
            "/api/v1/platform-admin/tenants/onboarding/**", // 토큰 단독 온보딩 인증 API
            "/api/v1/platform-admin/tenants/*/onboarding/**", // 테넌트 코드 기반 온보딩 인증/완료 API
            "/auth/login-jwt", // JWT 로그인
            "/auth/login-jwt/admin", // 플랫폼 관리자 JWT 로그인
            "/auth/login", // 일반 로그인
            "/auth/logout", // 로그아웃
            "/auth/refresh", // 토큰 갱신
            "/api/v1/system/server-time", // 서버 시간 조회 (인증 불필요)
            "/file", // 파일 다운로드
            "/etc/**", // 사용자단의 회원약관,회원가입,사용자아이디 중복여부체크 URL허용

            /* swagger */
            "/v3/api-docs/**",
            "/swagger-resources",
            "/swagger-resources/**",
            "/swagger-ui.html",
            "/swagger-ui/**",

    };
        private static final String[] ORIGIN_PATTERNS_WHITELIST = {
            "http://localhost:*",
            "http://127.0.0.1:*",
            "https://shmt-mes.vercel.app",
            "https://haccp-cloud.vercel.app",
        };

    @Bean
    public JwtAuthenticationFilter authenticationTokenFilterBean() throws Exception {
        return new JwtAuthenticationFilter();
    }

    @Bean
    protected CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOriginPatterns(Arrays.asList(ORIGIN_PATTERNS_WHITELIST));
        configuration.setAllowedMethods(Arrays.asList("HEAD", "POST", "GET", "DELETE", "PUT", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public CharacterEncodingFilter characterEncodingFilter() {
        CharacterEncodingFilter characterEncodingFilter = new CharacterEncodingFilter();
        characterEncodingFilter.setEncoding("UTF-8");
        characterEncodingFilter.setForceEncoding(true);
        return characterEncodingFilter;
    }

    @Bean
    public HTMLTagFilter htmlTagFilter() {
        return new HTMLTagFilter();
    }

    // 멀티파트 필터 빈
    @Bean
    public MultipartFilter multipartFilter() {
        return new MultipartFilter();
    }

    // 서블릿 컨테이너에 멀티파트 구성을 제공하기 위한 설정
    @Bean
    public MultipartConfigElement multipartConfigElement() {
        MultipartConfigFactory factory = new MultipartConfigFactory();
        factory.setMaxRequestSize(DataSize.ofMegabytes(100L));
        factory.setMaxFileSize(DataSize.ofMegabytes(100L));
        return factory.createMultipartConfig();
    }

    @Bean
    protected SecurityFilterChain filterChain(HttpSecurity http, TenantContextFilter tenantContextFilter) throws Exception {

        return http
                .csrf(AbstractHttpConfigurer::disable)
            .headers(headers -> headers
                .contentSecurityPolicy(csp -> csp.policyDirectives(CONTENT_SECURITY_POLICY)))
                .authorizeHttpRequests(authorize -> authorize
                    .antMatchers(HttpMethod.OPTIONS, "/**").permitAll() // CORS preflight 요청 허용
                        .antMatchers("/admin/**").hasRole("ADMIN") // 관리자 페이지는 ADMIN만 접근
                        .antMatchers("/api/admin/**").hasRole("ADMIN") // 관리자 API는 ADMIN만 접근
                        .antMatchers(HttpMethod.PATCH, "/members/password").hasAnyRole("ADMIN", "USER") // 비밀번호 변경은 모든 인증된 사용자 접근 가능
                        .antMatchers("/members/**").hasRole("ADMIN") // 회원 관리는 ADMIN만 접근
                        .antMatchers("/mypage/**").hasAnyRole("ADMIN", "USER") // 마이페이지는 ADMIN, USER 모두 접근
                        .antMatchers("/inform/**").hasAnyRole("ADMIN", "USER") // 게시판은 ADMIN, USER 모두 접근

                        .antMatchers("/api/processflow/**").permitAll()

                        .antMatchers(AUTH_WHITELIST).permitAll()
                        .antMatchers(HttpMethod.GET, AUTH_GET_WHITELIST).permitAll()
                        .anyRequest().authenticated())
                .sessionManagement(
                        (sessionManagement) -> sessionManagement.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .cors().and()
                .addFilterBefore(tenantContextFilter, ChannelProcessingFilter.class)
                .addFilterBefore(characterEncodingFilter(), ChannelProcessingFilter.class)
                .addFilterBefore(authenticationTokenFilterBean(), UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(multipartFilter(), CsrfFilter.class)
                .exceptionHandling(exceptionHandlingConfigurer -> exceptionHandlingConfigurer
                        .authenticationEntryPoint(new JwtAuthenticationEntryPoint()))
                .build();
    }

}