package egovframework.let.documents.portal.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import egovframework.let.documents.haccpwork.domain.repository.HaccpWorkDAO;
import egovframework.let.documents.portal.domain.model.HaccpPortalDocumentSearchConditionVO;
import egovframework.let.documents.portal.domain.repository.HaccpPortalDocumentDAO;
import egovframework.let.platform_admin.tenants.domain.repository.TenantInfoDAO;

class HaccpPortalDocumentServiceImplTest {

    private final HaccpPortalDocumentDAO dao = mock(HaccpPortalDocumentDAO.class);
    private final TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
    private final HaccpWorkDAO haccpWorkDAO = mock(HaccpWorkDAO.class);
    private final HaccpPortalDocumentServiceImpl service =
            new HaccpPortalDocumentServiceImpl(dao, tenantInfoDAO, haccpWorkDAO);

    private HaccpPortalDocumentSearchConditionVO captureCondition() throws Exception {
        ArgumentCaptor<HaccpPortalDocumentSearchConditionVO> captor = ArgumentCaptor
                .forClass(HaccpPortalDocumentSearchConditionVO.class);
        verify(dao).selectPortalDocuments(captor.capture());
        return captor.getValue();
    }

    private void stubTenant() throws Exception {
        when(tenantInfoDAO.selectTenantIdByCode("TENANT-A")).thenReturn(42L);
        when(dao.selectPortalDocuments(any(HaccpPortalDocumentSearchConditionVO.class)))
                .thenReturn(Collections.emptyList());
    }

    @DisplayName("문서포탈 목록 조회 시 tenantCode를 대문자로 정규화하고 tenantId를 함께 전달한다")
    @Test
    void listPortalDocuments_normalizesTenantCodeAndIncludesTenantId() throws Exception {
        stubTenant();

        service.listPortalDocuments("tenant-a", "admin01", "TENANT_ADMIN");

        HaccpPortalDocumentSearchConditionVO condition = captureCondition();
        assertEquals("TENANT-A", condition.getTenantCode());
        assertEquals(42L, condition.getTenantId());
    }

    @DisplayName("PLATFORM_ADMIN, TENANT_ADMIN은 담당자 필터 없이 전체 업무를 조회한다")
    @Test
    void listPortalDocuments_adminRolesSeeAll() throws Exception {
        stubTenant();

        service.listPortalDocuments("tenant-a", "admin01", "tenant_admin");
        service.listPortalDocuments("tenant-a", "platform_admin", "PLATFORM_ADMIN");

        ArgumentCaptor<HaccpPortalDocumentSearchConditionVO> captor = ArgumentCaptor
                .forClass(HaccpPortalDocumentSearchConditionVO.class);
        verify(dao, times(2)).selectPortalDocuments(captor.capture());
        for (HaccpPortalDocumentSearchConditionVO condition : captor.getAllValues()) {
            assertFalse(condition.isOnlyAssigned());
            assertNull(condition.getActorLoginId());
        }
        verify(haccpWorkDAO, never()).selectLoginIdByTenantAndLoginCode(anyMap());
    }

    @DisplayName("TENANT_USER는 본인 담당 업무만 조회하도록 담당자 식별값을 전달한다")
    @Test
    void listPortalDocuments_tenantUserSeesOnlyAssigned() throws Exception {
        stubTenant();
        when(haccpWorkDAO.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(7L);
        when(haccpWorkDAO.selectUserIdByTenantAndLoginId(anyMap())).thenReturn(9L);

        service.listPortalDocuments("tenant-a", " user01 ", "TENANT_USER");

        HaccpPortalDocumentSearchConditionVO condition = captureCondition();
        assertTrue(condition.isOnlyAssigned());
        assertEquals(7L, condition.getActorLoginId());
        assertEquals(9L, condition.getActorUserId());
        assertEquals("user01", condition.getActorLoginCode());
    }

    @DisplayName("역할 코드가 비어 있으면 본인 담당 업무만 조회한다 (fail-closed)")
    @Test
    void listPortalDocuments_blankRoleIsFailClosed() throws Exception {
        stubTenant();

        service.listPortalDocuments("tenant-a", null, "");

        HaccpPortalDocumentSearchConditionVO condition = captureCondition();
        assertTrue(condition.isOnlyAssigned());
        assertNull(condition.getActorLoginId());
        assertNull(condition.getActorUserId());
        assertNull(condition.getActorLoginCode());
    }
}
