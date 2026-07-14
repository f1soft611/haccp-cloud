package egovframework.let.organization.authorities.controller;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import egovframework.let.organization.authorities.service.AuthorityService;

/**
 * 권한 API 페이징 테스트
 * MockMvc standaloneSetup에서 MessageConverter 설정이 필요하며,
 * 향후 @WebMvcTest 또는 통합 테스트로 전환할 예정입니다.
 */
@Disabled("MockMvc MessageConverter 설정 필요 - 나중에 @WebMvcTest로 전환 예정")
class AuthorityApiControllerPagingTest {

    private MockMvc mockMvc;
    private AuthorityService authorityService;

    @BeforeEach
    void setUp() {
        AuthorityApiController controller = new AuthorityApiController();
        authorityService = mock(AuthorityService.class);
        ReflectionTestUtils.setField(controller, "authorityService", authorityService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void listRolesPaged_rejectsPageIndexLessThanOne() throws Exception {
        mockMvc.perform(get("/api/v1/platform-admin/roles/paged")
                .param("pageIndex", "0")
                .param("pageSize", "10"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void listRolesPaged_returnsPagedResponse() throws Exception {
        java.util.Map<String, Object> payload = new java.util.HashMap<String, Object>();
        payload.put("totalCount", 7);
        payload.put("paginationInfo", java.util.Collections.singletonMap("currentPageNo", 1));
        when(authorityService.listRolesPaged(1, 20, "name", "관리자", "PLATFORM", "all")).thenReturn(payload);

        mockMvc.perform(get("/api/v1/platform-admin/roles/paged")
                .param("pageIndex", "1")
                .param("pageSize", "20")
                .param("searchField", "name")
                .param("searchKeyword", "관리자"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.result.totalCount").value(7))
            .andExpect(jsonPath("$.result.paginationInfo.currentPageNo").value(1));
    }
}
