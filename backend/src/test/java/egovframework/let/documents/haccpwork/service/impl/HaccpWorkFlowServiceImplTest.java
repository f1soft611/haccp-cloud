package egovframework.let.documents.haccpwork.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import egovframework.let.documents.haccpwork.domain.model.HaccpWorkApprovalStatusUpdateRequestVO;
import egovframework.let.documents.haccpwork.domain.repository.HaccpWorkDAO;
import egovframework.let.documents.haccpwork.service.HaccpWorkDraftService;

class HaccpWorkFlowServiceImplTest {

    @DisplayName("최종기안 확인이 완료된 문서는 최종승인자가 결재취소할 수 없다")
    @Test
    void updateApprovalStatus_submitCancelRejectedAfterFinalOwnerConfirm() throws Exception {
        HaccpWorkDraftService draftService = mock(HaccpWorkDraftService.class);
        HaccpWorkDAO haccpWorkDAO = mock(HaccpWorkDAO.class);
        HaccpWorkFlowServiceImpl service = new HaccpWorkFlowServiceImpl(draftService, haccpWorkDAO);

        when(haccpWorkDAO.selectTenantIdByCode("TENANT_001")).thenReturn(10L);
        when(haccpWorkDAO.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(3001L);

        Map<String, Object> actorProfile = new HashMap<String, Object>();
        actorProfile.put("userName", "최종승인자");
        when(haccpWorkDAO.selectApprovalActorProfile(anyMap())).thenReturn(actorProfile);

        Map<String, Object> approvalMain = new HashMap<String, Object>();
        approvalMain.put("electronicApprovalId", 77L);
        when(haccpWorkDAO.selectApprovalMainById(anyMap())).thenReturn(approvalMain);

        when(haccpWorkDAO.selectFinalOwnerConfirmedCountByApprovalId(anyMap())).thenReturn(1);

        HaccpWorkApprovalStatusUpdateRequestVO payload = new HaccpWorkApprovalStatusUpdateRequestVO();
        payload.setEventType("submit_cancel");

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.updateApprovalStatus(77L, "tenant_001", payload, "3001"));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getReason() != null && ex.getReason().contains("최종기안 확인 완료"));
        verify(haccpWorkDAO, never()).selectLatestCompletedDraftedSeqByApprovalId(anyMap());
    }
}
