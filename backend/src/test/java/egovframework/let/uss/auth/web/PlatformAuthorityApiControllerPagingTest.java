package egovframework.let.uss.auth.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Collections;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import egovframework.let.uss.auth.service.AuthorityInfoVO;
import egovframework.let.uss.auth.service.EgovAuthManageService;

class PlatformAuthorityApiControllerPagingTest {

    private MockMvc mockMvc;
    private EgovAuthManageService authManageService;

    @BeforeEach
    void setUp() {
        PlatformAuthorityApiController controller = new PlatformAuthorityApiController();
        authManageService = mock(EgovAuthManageService.class);
        ReflectionTestUtils.setField(controller, "authManageService", authManageService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void listRolesPaged_rejectsPageIndexLessThanOne() throws Exception {
        mockMvc.perform(get("/api/platform-admin/roles/paged")
                .param("pageIndex", "0")
                .param("pageSize", "10"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void listRolesPaged_returnsPagedResponse() throws Exception {
        AuthorityInfoVO item = new AuthorityInfoVO();
        item.setAuthorityCode("TENANT_ADMIN");
        when(authManageService.selectAuthorityPagedList(any(AuthorityInfoVO.class))).thenReturn(Collections.singletonList(item));
        when(authManageService.selectAuthorityPagedCount(any(AuthorityInfoVO.class))).thenReturn(7);

        mockMvc.perform(get("/api/platform-admin/roles/paged")
                .param("pageIndex", "1")
                .param("pageSize", "20")
                .param("searchField", "name")
                .param("searchKeyword", "관리자"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.result.totalCount").value(7))
            .andExpect(jsonPath("$.result.paginationInfo.currentPageNo").value(1));
    }
}
