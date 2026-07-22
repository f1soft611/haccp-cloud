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

class HaccpPortalDocumentServiceImplTest {

    @DisplayName("문서포탈 목록 조회 시 tenantCode를 대문자로 정규화해 DAO에 전달한다")
    @Test
    void listPortalDocuments_normalizesTenantCode() throws Exception {
        HaccpPortalDocumentDAO dao = org.mockito.Mockito.mock(HaccpPortalDocumentDAO.class);
        HaccpPortalDocumentServiceImpl service = new HaccpPortalDocumentServiceImpl(dao);

        when(dao.selectPortalDocuments(org.mockito.ArgumentMatchers.any(HaccpPortalDocumentSearchConditionVO.class)))
                .thenReturn(Collections.emptyList());

        service.listPortalDocuments("tenant-a");

        ArgumentCaptor<HaccpPortalDocumentSearchConditionVO> captor = ArgumentCaptor
                .forClass(HaccpPortalDocumentSearchConditionVO.class);
        verify(dao).selectPortalDocuments(captor.capture());
        assertEquals("TENANT-A", captor.getValue().getTenantCode());
    }
}
