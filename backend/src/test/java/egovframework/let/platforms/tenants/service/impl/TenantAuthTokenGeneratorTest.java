package egovframework.let.platforms.tenants.service.impl;

import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TenantAuthTokenGeneratorTest {

    @Test
    void generateToken_returnsValidFormat() {
        String token = TenantAuthTokenGenerator.generateToken();

        assertTrue(token.matches("\\d{6}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"));
        assertEquals(43, token.length());
    }

    @Test
    void generateToken_returnsUniqueTokens() {
        String token1 = TenantAuthTokenGenerator.generateToken();
        String token2 = TenantAuthTokenGenerator.generateToken();

        assertNotEquals(token1, token2);
    }

    @Test
    void calculateExpiry_returns24HoursLater() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiry = TenantAuthTokenGenerator.calculateExpiry();

        assertTrue(expiry.isAfter(now.plusHours(23)));
        assertTrue(expiry.isBefore(now.plusHours(24).plusMinutes(1)));
    }

    @Test
    void isExpired_returnsTrueForPastTime() {
        LocalDateTime pastTime = LocalDateTime.now().minusHours(1);

        assertTrue(TenantAuthTokenGenerator.isExpired(pastTime));
    }

    @Test
    void isExpired_returnsFalseForFutureTime() {
        LocalDateTime futureTime = LocalDateTime.now().plusHours(1);

        assertFalse(TenantAuthTokenGenerator.isExpired(futureTime));
    }
}
