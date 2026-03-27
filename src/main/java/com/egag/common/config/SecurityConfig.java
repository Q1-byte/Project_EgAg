package com.egag.common.config;

import com.egag.auth.JwtAuthFilter;
import com.egag.auth.AuthService; // 1. AuthService 임포트 추가
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager; // 2. 추가
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration; // 3. 추가
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import static org.springframework.security.config.Customizer.withDefaults;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final AuthService authService; // 4. 본인 코드에서 가져옴

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(withDefaults())
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .userDetailsService(authService)
                .authorizeHttpRequests(auth -> auth
                        // 1. 기존 팀원 코드 유지
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/auth/kakao/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/canvas/transform").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/canvas/consume-token").authenticated()
                        .requestMatchers("/api/canvas/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/artworks/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/gallery/public").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/{id}/artworks").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/inquiries/my").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/inquiries/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/inquiries").authenticated()
                        .requestMatchers("/api/policy/**").permitAll()
                        .requestMatchers("/api/payments/webhook").permitAll()
                        .requestMatchers("/api/payments/kakaopay/approve").permitAll()
                        .requestMatchers("/api/payments/toss/callback").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/payments/status/**").permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/admin/main-images").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) ->
                                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized"))
                )
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // 6. 본인 코드에서 가져온 AuthenticationManager Bean
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}