package egovframework.let.documents.haccpwork.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import egovframework.let.documents.haccpwork.domain.model.HaccpWorkApprovalStatusUpdateRequestVO;
import egovframework.let.documents.haccpwork.domain.repository.HaccpWorkDAO;
import egovframework.let.documents.haccpwork.service.HaccpWorkDraftService;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkVO;

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

    @DisplayName("검토승인 취소 시 시스템 댓글은 검토승인 취소 문구로 저장된다")
    @Test
    void updateApprovalStatus_submitCancelAfterReviewApprove_usesReviewCancelMessage() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitCancelMessageTest(2);

        HaccpWorkApprovalStatusUpdateRequestVO payload = new HaccpWorkApprovalStatusUpdateRequestVO();
        payload.setEventType("submit_cancel");

        service.updateApprovalStatus(77L, "tenant_001", payload, "3001");

        ArgumentCaptor<Map> insertCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO).insertElectronicApprovalHistoryMain(insertCaptor.capture());
        Object answerCnt = insertCaptor.getValue().get("answerCnt");
        assertEquals("[시스템] 최종승인자님이 검토승인 취소 처리했습니다.", answerCnt);
    }

    @DisplayName("승인 취소 시 시스템 댓글은 승인 취소 문구로 저장된다")
    @Test
    void updateApprovalStatus_submitCancelAfterApprove_usesApproveCancelMessage() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitCancelMessageTest(3);

        HaccpWorkApprovalStatusUpdateRequestVO payload = new HaccpWorkApprovalStatusUpdateRequestVO();
        payload.setEventType("submit_cancel");

        service.updateApprovalStatus(77L, "tenant_001", payload, "3001");

        ArgumentCaptor<Map> insertCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO).insertElectronicApprovalHistoryMain(insertCaptor.capture());
        Object answerCnt = insertCaptor.getValue().get("answerCnt");
        assertEquals("[시스템] 최종승인자님이 승인 취소 처리했습니다.", answerCnt);
    }

    private HaccpWorkDAO serviceHaccpWorkDAO;

    private HaccpWorkFlowServiceImpl createServiceForSubmitCancelMessageTest(int latestCompletedSeq) throws Exception {
        HaccpWorkDraftService draftService = mock(HaccpWorkDraftService.class);
        serviceHaccpWorkDAO = mock(HaccpWorkDAO.class);
        HaccpWorkFlowServiceImpl service = new HaccpWorkFlowServiceImpl(draftService, serviceHaccpWorkDAO);

        when(serviceHaccpWorkDAO.selectTenantIdByCode("TENANT_001")).thenReturn(10L);
        when(serviceHaccpWorkDAO.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(3001L);

        Map<String, Object> actorProfile = new HashMap<String, Object>();
        actorProfile.put("userName", "최종승인자");
        when(serviceHaccpWorkDAO.selectApprovalActorProfile(anyMap())).thenReturn(actorProfile);

        Map<String, Object> approvalMain = new HashMap<String, Object>();
        approvalMain.put("electronicApprovalId", 77L);
        when(serviceHaccpWorkDAO.selectApprovalMainById(anyMap())).thenReturn(approvalMain);

        when(serviceHaccpWorkDAO.selectFinalOwnerConfirmedCountByApprovalId(anyMap())).thenReturn(0);
        when(serviceHaccpWorkDAO.selectLatestCompletedDraftedSeqByApprovalId(anyMap())).thenReturn(latestCompletedSeq);
        when(serviceHaccpWorkDAO.selectLatestCompletedDraftedSeqByApprovalAndLogin(anyMap())).thenReturn(latestCompletedSeq);

        when(serviceHaccpWorkDAO.updateElectronicApprovalLineStatus(anyMap())).thenReturn(1);

        Map<String, Object> historyLineInfo = new HashMap<String, Object>();
        historyLineInfo.put("electronicApprovalLineId", 100L);
        historyLineInfo.put("exeSeq", latestCompletedSeq);
        historyLineInfo.put("approvalType", "drafted");
        historyLineInfo.put("eabusNo", "001");
        historyLineInfo.put("eaExeId", "EA-001");
        when(serviceHaccpWorkDAO.selectApprovalLineForHistoryBySeq(anyMap())).thenReturn(historyLineInfo);
        when(serviceHaccpWorkDAO.selectNextApprovalHistoryAnswerSeq(anyMap())).thenReturn(1);

        when(serviceHaccpWorkDAO.selectFinalOwnerExeSeqByApprovalId(anyMap())).thenReturn(4);
        when(draftService.getDraftTemplate(eq("TENANT_001"), eq(77L), eq("approval"), eq("3001")))
            .thenReturn(new HaccpWorkVO());

        return service;
    }
}
