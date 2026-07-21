package egovframework.let.documents.haccpwork.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import egovframework.let.documents.haccpwork.domain.model.HaccpWorkSearchConditionVO;
import egovframework.let.documents.haccpwork.domain.repository.HaccpWorkDAO;

class HaccpWorkDraftServiceImplTest {

    @DisplayName("문서 목록 조회 시 참여유형 '결재자'는 APPROVER로 정규화된다")
    @Test
    void listDocuments_normalizesApproverParticipantType() throws Exception {
        HaccpWorkDAO haccpWorkDAO = org.mockito.Mockito.mock(HaccpWorkDAO.class);
        HaccpWorkDraftServiceImpl service = new HaccpWorkDraftServiceImpl(haccpWorkDAO);

        when(haccpWorkDAO.selectTenantIdByCode("TENANT_001")).thenReturn(10L);
        when(haccpWorkDAO.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(3001L);
        when(haccpWorkDAO.selectUserIdByTenantAndLoginId(anyMap())).thenReturn(5001L);
        when(haccpWorkDAO.selectDocumentList(org.mockito.ArgumentMatchers.any(HaccpWorkSearchConditionVO.class)))
                .thenReturn(Collections.emptyList());

        service.listDocuments(
                "tenant_001",
                "3001",
                "tenant_user",
                "전체",
                "",
                "",
                "",
                "결재자",
                "전체",
                "2026-07-01",
                "2026-07-21"
        );

        ArgumentCaptor<HaccpWorkSearchConditionVO> captor = ArgumentCaptor.forClass(HaccpWorkSearchConditionVO.class);
        verify(haccpWorkDAO).selectDocumentList(captor.capture());

        HaccpWorkSearchConditionVO condition = captor.getValue();
        assertEquals("APPROVER", condition.getParticipantType());
        assertEquals("TENANT_001", condition.getTenantCode());
    }

    @DisplayName("문서 목록 조회 시 알 수 없는 참여유형은 필터로 적용하지 않는다")
    @Test
    void listDocuments_ignoresUnknownParticipantType() throws Exception {
        HaccpWorkDAO haccpWorkDAO = org.mockito.Mockito.mock(HaccpWorkDAO.class);
        HaccpWorkDraftServiceImpl service = new HaccpWorkDraftServiceImpl(haccpWorkDAO);

        when(haccpWorkDAO.selectTenantIdByCode("TENANT_001")).thenReturn(10L);
        when(haccpWorkDAO.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(3001L);
        when(haccpWorkDAO.selectUserIdByTenantAndLoginId(anyMap())).thenReturn(5001L);
        when(haccpWorkDAO.selectDocumentList(org.mockito.ArgumentMatchers.any(HaccpWorkSearchConditionVO.class)))
                .thenReturn(Collections.emptyList());

        service.listDocuments(
                "tenant_001",
                "3001",
                "tenant_user",
                "전체",
                "",
                "",
                "",
                "아무거나",
                "전체",
                "2026-07-01",
                "2026-07-21"
        );

        ArgumentCaptor<HaccpWorkSearchConditionVO> captor = ArgumentCaptor.forClass(HaccpWorkSearchConditionVO.class);
        verify(haccpWorkDAO).selectDocumentList(captor.capture());

        HaccpWorkSearchConditionVO condition = captor.getValue();
        assertNull(condition.getParticipantType());
    }

        @DisplayName("문서 목록 페이징 조회 시 페이지 조건과 totalCount를 함께 반환한다")
        @Test
        void listDocumentsPaged_returnsPaginationPayload() throws Exception {
                HaccpWorkDAO haccpWorkDAO = org.mockito.Mockito.mock(HaccpWorkDAO.class);
                HaccpWorkDraftServiceImpl service = new HaccpWorkDraftServiceImpl(haccpWorkDAO);

                when(haccpWorkDAO.selectTenantIdByCode("TENANT_001")).thenReturn(10L);
                when(haccpWorkDAO.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(3001L);
                when(haccpWorkDAO.selectUserIdByTenantAndLoginId(anyMap())).thenReturn(5001L);
                when(haccpWorkDAO.selectDocumentList(org.mockito.ArgumentMatchers.any(HaccpWorkSearchConditionVO.class)))
                                .thenReturn(Collections.emptyList());
                when(haccpWorkDAO.selectDocumentListCount(org.mockito.ArgumentMatchers.any(HaccpWorkSearchConditionVO.class)))
                                .thenReturn(37);

                Map<String, Object> result = service.listDocumentsPaged(
                                "tenant_001",
                                "3001",
                                "tenant_user",
                                "전체",
                                "",
                                "",
                                "",
                                "결재자",
                                "전체",
                                "2026-07-01",
                                "2026-07-21",
                                3,
                                20
                );

                ArgumentCaptor<HaccpWorkSearchConditionVO> captor = ArgumentCaptor.forClass(HaccpWorkSearchConditionVO.class);
                verify(haccpWorkDAO).selectDocumentList(captor.capture());
                verify(haccpWorkDAO).selectDocumentListCount(org.mockito.ArgumentMatchers.any(HaccpWorkSearchConditionVO.class));

                HaccpWorkSearchConditionVO condition = captor.getValue();
                assertEquals(3, condition.getPageIndex());
                assertEquals(20, condition.getRecordCountPerPage());
                assertEquals(40, condition.getFirstIndex());
                assertEquals(37, ((Integer) result.get("totalCount")).intValue());
                assertTrue(result.containsKey("paginationInfo"));
        }
}
