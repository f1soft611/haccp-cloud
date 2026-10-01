package egovframework.let.documents.portal.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import egovframework.let.documents.portal.domain.model.HaccpPortalDocumentSearchConditionVO;
import egovframework.let.documents.portal.domain.repository.HaccpPortalDocumentDAO;
import egovframework.let.platform_admin.tenants.domain.repository.TenantInfoDAO;

class HaccpPortalDocumentServiceImplTest {

    @DisplayName("문서포탈 목록 조회 시 tenantCode를 대문자로 정규화하고 tenantId를 함께 전달한다")
    @Test
    void listPortalDocuments_normalizesTenantCodeAndIncludesTenantId() throws Exception {
        HaccpPortalDocumentDAO dao = org.mockito.Mockito.mock(HaccpPortalDocumentDAO.class);
        TenantInfoDAO tenantInfoDAO = org.mockito.Mockito.mock(TenantInfoDAO.class);
        HaccpPortalDocumentServiceImpl service = new HaccpPortalDocumentServiceImpl(dao, tenantInfoDAO);

        when(tenantInfoDAO.selectTenantIdByCode("TENANT-A")).thenReturn(42L);
        when(dao.selectPortalDocuments(org.mockito.ArgumentMatchers.any(HaccpPortalDocumentSearchConditionVO.class)))
                .thenReturn(Collections.emptyList());

        service.listPortalDocuments("tenant-a");

        ArgumentCaptor<HaccpPortalDocumentSearchConditionVO> captor = ArgumentCaptor
                .forClass(HaccpPortalDocumentSearchConditionVO.class);
        verify(dao).selectPortalDocuments(captor.capture());
        assertEquals("TENANT-A", captor.getValue().getTenantCode());
        assertEquals(42L, captor.getValue().getTenantId());
    }
}
