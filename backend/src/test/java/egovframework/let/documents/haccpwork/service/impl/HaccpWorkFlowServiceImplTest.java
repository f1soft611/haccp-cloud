package egovframework.let.documents.haccpwork.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.lang.reflect.Field;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import egovframework.let.documents.haccpwork.domain.model.HaccpWorkApprovalStatusUpdateRequestVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkApprovalCommentUpdateRequestVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkDraftSubmitRequestVO;
import egovframework.let.documents.haccpwork.domain.repository.HaccpWorkDAO;
import egovframework.let.documents.haccpwork.service.HaccpWorkDraftService;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkVO;
import org.egovframe.rte.fdl.idgnr.EgovIdGnrService;

class HaccpWorkFlowServiceImplTest {

    @DisplayName("시스템 댓글은 수정할 수 없다")
    @Test
    void updateApprovalComment_rejectsSystemComment() throws Exception {
        HaccpWorkDraftService draftService = mock(HaccpWorkDraftService.class);
        HaccpWorkDAO haccpWorkDAO = mock(HaccpWorkDAO.class);
        HaccpWorkFlowServiceImpl service = new HaccpWorkFlowServiceImpl(draftService, haccpWorkDAO);

        when(haccpWorkDAO.selectTenantIdByCode("TENANT_001")).thenReturn(10L);
        when(haccpWorkDAO.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(3001L);
        when(haccpWorkDAO.selectApprovalTemplateAccessCount(anyMap())).thenReturn(1);

        Map<String, Object> commentRow = new HashMap<String, Object>();
        commentRow.put("commentId", 200L);
        commentRow.put("answerTypeName", "SYSTEM");
        commentRow.put("createdBy", 3001L);
        when(haccpWorkDAO.selectApprovalHistoryCommentById(anyMap())).thenReturn(commentRow);

        HaccpWorkApprovalCommentUpdateRequestVO payload = new HaccpWorkApprovalCommentUpdateRequestVO();
        payload.setComment("수정 시도");

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.updateApprovalComment(77L, 200L, "tenant_001", payload, "3001"));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getReason() != null && ex.getReason().contains("시스템 댓글"));
        verify(haccpWorkDAO, never()).updateElectronicApprovalHistoryComment(anyMap());
    }

    @DisplayName("시스템 댓글은 삭제할 수 없다")
    @Test
    void deleteApprovalComment_rejectsSystemComment() throws Exception {
        HaccpWorkDraftService draftService = mock(HaccpWorkDraftService.class);
        HaccpWorkDAO haccpWorkDAO = mock(HaccpWorkDAO.class);
        HaccpWorkFlowServiceImpl service = new HaccpWorkFlowServiceImpl(draftService, haccpWorkDAO);

        when(haccpWorkDAO.selectTenantIdByCode("TENANT_001")).thenReturn(10L);
        when(haccpWorkDAO.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(3001L);
        when(haccpWorkDAO.selectApprovalTemplateAccessCount(anyMap())).thenReturn(1);

        Map<String, Object> commentRow = new HashMap<String, Object>();
        commentRow.put("commentId", 200L);
        commentRow.put("answerTypeName", "SYSTEM");
        commentRow.put("createdBy", 3001L);
        when(haccpWorkDAO.selectApprovalHistoryCommentById(anyMap())).thenReturn(commentRow);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.deleteApprovalComment(77L, 200L, "tenant_001", "3001"));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getReason() != null && ex.getReason().contains("시스템 댓글"));
        verify(haccpWorkDAO, never()).softDeleteElectronicApprovalHistoryComment(anyMap());
    }

    @DisplayName("수동 댓글은 수정할 수 있다")
    @Test
    void updateApprovalComment_updatesManualComment() throws Exception {
        HaccpWorkDraftService draftService = mock(HaccpWorkDraftService.class);
        HaccpWorkDAO haccpWorkDAO = mock(HaccpWorkDAO.class);
        HaccpWorkFlowServiceImpl service = new HaccpWorkFlowServiceImpl(draftService, haccpWorkDAO);

        when(haccpWorkDAO.selectTenantIdByCode("TENANT_001")).thenReturn(10L);
        when(haccpWorkDAO.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(3001L);
        when(haccpWorkDAO.selectApprovalTemplateAccessCount(anyMap())).thenReturn(1);
        when(haccpWorkDAO.selectApprovalHistoryCommentById(anyMap())).thenAnswer(invocation -> {
            Map<String, Object> row = new HashMap<String, Object>();
            row.put("commentId", 200L);
            row.put("answerTypeName", "USER");
            row.put("createdBy", 3001L);
            return row;
        });
        when(haccpWorkDAO.updateElectronicApprovalHistoryComment(anyMap())).thenReturn(1);

        HaccpWorkApprovalCommentUpdateRequestVO payload = new HaccpWorkApprovalCommentUpdateRequestVO();
        payload.setComment("수정된 의견");

        service.updateApprovalComment(77L, 200L, "tenant_001", payload, "3001");

        ArgumentCaptor<Map> updateCaptor = ArgumentCaptor.forClass(Map.class);
        verify(haccpWorkDAO).updateElectronicApprovalHistoryComment(updateCaptor.capture());
        assertEquals(10L, updateCaptor.getValue().get("tenantId"));
        assertEquals(200L, updateCaptor.getValue().get("commentId"));
        assertEquals(3001L, updateCaptor.getValue().get("actorLoginId"));
        assertEquals("수정된 의견", updateCaptor.getValue().get("comment"));
    }

    @DisplayName("수동 댓글은 삭제 시 소프트 삭제 문구로 바뀐다")
    @Test
    void deleteApprovalComment_softDeletesManualComment() throws Exception {
        HaccpWorkDraftService draftService = mock(HaccpWorkDraftService.class);
        HaccpWorkDAO haccpWorkDAO = mock(HaccpWorkDAO.class);
        HaccpWorkFlowServiceImpl service = new HaccpWorkFlowServiceImpl(draftService, haccpWorkDAO);

        when(haccpWorkDAO.selectTenantIdByCode("TENANT_001")).thenReturn(10L);
        when(haccpWorkDAO.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(3001L);
        when(haccpWorkDAO.selectApprovalTemplateAccessCount(anyMap())).thenReturn(1);
        when(haccpWorkDAO.selectApprovalHistoryCommentById(anyMap())).thenAnswer(invocation -> {
            Map<String, Object> row = new HashMap<String, Object>();
            row.put("commentId", 200L);
            row.put("answerTypeName", "USER");
            row.put("createdBy", 3001L);
            return row;
        });
        when(haccpWorkDAO.softDeleteElectronicApprovalHistoryComment(anyMap())).thenReturn(1);

        service.deleteApprovalComment(77L, 200L, "tenant_001", "3001");

        ArgumentCaptor<Map> deleteCaptor = ArgumentCaptor.forClass(Map.class);
        verify(haccpWorkDAO).softDeleteElectronicApprovalHistoryComment(deleteCaptor.capture());
        assertEquals(10L, deleteCaptor.getValue().get("tenantId"));
        assertEquals(200L, deleteCaptor.getValue().get("commentId"));
        assertEquals(3001L, deleteCaptor.getValue().get("actorLoginId"));
    }

    @DisplayName("수동 댓글 좋아요를 토글할 수 있다")
    @Test
    void toggleApprovalCommentLike_togglesManualCommentLike() throws Exception {
        HaccpWorkDraftService draftService = mock(HaccpWorkDraftService.class);
        HaccpWorkDAO haccpWorkDAO = mock(HaccpWorkDAO.class);
        HaccpWorkFlowServiceImpl service = new HaccpWorkFlowServiceImpl(draftService, haccpWorkDAO);

        when(haccpWorkDAO.selectTenantIdByCode("TENANT_001")).thenReturn(10L);
        when(haccpWorkDAO.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(3001L);
        when(haccpWorkDAO.selectApprovalTemplateAccessCount(anyMap())).thenReturn(1);

        Map<String, Object> commentRow = new HashMap<String, Object>();
        commentRow.put("commentId", 200L);
        commentRow.put("answerTypeName", "USER");
        commentRow.put("createdBy", 3001L);
        when(haccpWorkDAO.selectApprovalHistoryCommentById(anyMap())).thenReturn(commentRow);
        when(haccpWorkDAO.selectApprovalCommentLikeExists(anyMap())).thenReturn(0);
        when(haccpWorkDAO.insertApprovalCommentLike(anyMap())).thenReturn(1);

        service.toggleApprovalCommentLike(77L, 200L, "tenant_001", "3001");

        verify(haccpWorkDAO).insertApprovalCommentLike(anyMap());
        verify(haccpWorkDAO, never()).deleteApprovalCommentLike(anyMap());
    }

    @DisplayName("시스템 댓글에는 좋아요를 할 수 없다")
    @Test
    void toggleApprovalCommentLike_rejectsSystemComment() throws Exception {
        HaccpWorkDraftService draftService = mock(HaccpWorkDraftService.class);
        HaccpWorkDAO haccpWorkDAO = mock(HaccpWorkDAO.class);
        HaccpWorkFlowServiceImpl service = new HaccpWorkFlowServiceImpl(draftService, haccpWorkDAO);

        when(haccpWorkDAO.selectTenantIdByCode("TENANT_001")).thenReturn(10L);
        when(haccpWorkDAO.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(3001L);
        when(haccpWorkDAO.selectApprovalTemplateAccessCount(anyMap())).thenReturn(1);

        Map<String, Object> commentRow = new HashMap<String, Object>();
        commentRow.put("commentId", 200L);
        commentRow.put("answerTypeName", "SYSTEM");
        commentRow.put("createdBy", 3001L);
        when(haccpWorkDAO.selectApprovalHistoryCommentById(anyMap())).thenReturn(commentRow);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.toggleApprovalCommentLike(77L, 200L, "tenant_001", "3001"));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getReason() != null && ex.getReason().contains("시스템 댓글"));
        verify(haccpWorkDAO, never()).insertApprovalCommentLike(anyMap());
        verify(haccpWorkDAO, never()).deleteApprovalCommentLike(anyMap());
    }

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

    @DisplayName("검토자와 승인자가 같으면 검토승인 요청 한 번으로 최종승인까지 이어진다")
    @Test
    void updateApprovalStatus_reviewApproveAutoAdvancesWhenNextAssigneeIsSameActor() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForApprovalChainTest(3001L, 3001L);

        HaccpWorkApprovalStatusUpdateRequestVO payload = new HaccpWorkApprovalStatusUpdateRequestVO();
        payload.setEventType("review_approve");

        service.updateApprovalStatus(77L, "tenant_001", payload, "3001");

        verify(serviceHaccpWorkDAO, times(2)).updateElectronicApprovalLineStatus(anyMap());
        verify(serviceHaccpWorkDAO, times(2)).updateElectronicApprovalMainStatus(anyMap());
        verify(serviceHaccpWorkDAO, times(2)).insertElectronicApprovalHistoryMain(anyMap());
        verify(serviceHaccpWorkDAO, times(2)).updateElectronicApprovalLineArrival(anyMap());

        ArgumentCaptor<Map> historyCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO, times(2)).insertElectronicApprovalHistoryMain(historyCaptor.capture());
        assertEquals(2, historyCaptor.getAllValues().size());
        assertEquals(2, historyCaptor.getAllValues().get(0).get("exeSeq"));
        assertEquals("[시스템] 검토자님이 검토승인 처리했습니다.", historyCaptor.getAllValues().get(0).get("answerCnt"));
        assertEquals(3, historyCaptor.getAllValues().get(1).get("exeSeq"));
        assertEquals("[시스템] 검토자님이 최종승인 처리했습니다.", historyCaptor.getAllValues().get(1).get("answerCnt"));

        ArgumentCaptor<Map> mainCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO, times(2)).updateElectronicApprovalMainStatus(mainCaptor.capture());
        assertEquals("approved", mainCaptor.getAllValues().get(1).get("statusType"));
        assertEquals("완료", mainCaptor.getAllValues().get(1).get("statusTypeName"));

        ArgumentCaptor<Map> arrivalCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO, times(2)).updateElectronicApprovalLineArrival(arrivalCaptor.capture());
        assertEquals(3, arrivalCaptor.getAllValues().get(0).get("exeSeq"));
        assertEquals("승인요청", arrivalCaptor.getAllValues().get(0).get("optionName"));
        assertEquals(4, arrivalCaptor.getAllValues().get(1).get("exeSeq"));
        assertEquals("최종기안알림", arrivalCaptor.getAllValues().get(1).get("optionName"));
    }

    @DisplayName("다음 승인자가 다른 사용자면 검토승인까지만 처리하고 다음 결재선만 열어둔다")
    @Test
    void updateApprovalStatus_reviewApproveStopsWhenNextAssigneeDiffers() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForApprovalChainTest(3001L, 4001L);

        HaccpWorkApprovalStatusUpdateRequestVO payload = new HaccpWorkApprovalStatusUpdateRequestVO();
        payload.setEventType("review_approve");

        service.updateApprovalStatus(77L, "tenant_001", payload, "3001");

        verify(serviceHaccpWorkDAO, times(1)).updateElectronicApprovalLineStatus(anyMap());
        verify(serviceHaccpWorkDAO, times(1)).updateElectronicApprovalMainStatus(anyMap());
        verify(serviceHaccpWorkDAO, times(1)).insertElectronicApprovalHistoryMain(anyMap());
        verify(serviceHaccpWorkDAO, times(1)).updateElectronicApprovalLineArrival(anyMap());

        ArgumentCaptor<Map> historyCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO, times(1)).insertElectronicApprovalHistoryMain(historyCaptor.capture());
        assertEquals(2, historyCaptor.getValue().get("exeSeq"));
        assertEquals("[시스템] 검토자님이 검토승인 처리했습니다.", historyCaptor.getValue().get("answerCnt"));

        ArgumentCaptor<Map> mainCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO, times(1)).updateElectronicApprovalMainStatus(mainCaptor.capture());
        assertEquals("in_progress", mainCaptor.getValue().get("statusType"));
        assertEquals("진행중", mainCaptor.getValue().get("statusTypeName"));

        ArgumentCaptor<Map> arrivalCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO, times(1)).updateElectronicApprovalLineArrival(arrivalCaptor.capture());
        assertEquals(3, arrivalCaptor.getValue().get("exeSeq"));
        assertEquals("승인요청", arrivalCaptor.getValue().get("optionName"));
    }

    @DisplayName("검토자와 승인자가 같으면 결재신청 후 검토승인과 최종승인까지 자동으로 이어진다")
    @Test
    void submitDraft_autoAdvancesThroughReviewAndFinalWhenSameActor() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitChainTest(3001L, 3001L);

        HaccpWorkDraftSubmitRequestVO payload = new HaccpWorkDraftSubmitRequestVO();
        payload.setTitle("제출 테스트");

        Long approvalId = service.submitDraft(77L, "tenant_001", payload, "3001");

        assertEquals(77L, approvalId);
        verify(serviceHaccpWorkDAO, times(2)).updateElectronicApprovalLineStatus(anyMap());
        verify(serviceHaccpWorkDAO, times(2)).updateElectronicApprovalMainStatus(anyMap());
        verify(serviceHaccpWorkDAO, times(3)).insertElectronicApprovalHistoryMain(anyMap());

        ArgumentCaptor<Map> historyCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO, times(3)).insertElectronicApprovalHistoryMain(historyCaptor.capture());
        assertEquals(1, historyCaptor.getAllValues().get(0).get("exeSeq"));
        assertEquals("[시스템] 검토자님이 결재신청 처리했습니다.", historyCaptor.getAllValues().get(0).get("answerCnt"));
        assertEquals(2, historyCaptor.getAllValues().get(1).get("exeSeq"));
        assertEquals("[시스템] 검토자님이 검토승인 처리했습니다.", historyCaptor.getAllValues().get(1).get("answerCnt"));
        assertEquals(3, historyCaptor.getAllValues().get(2).get("exeSeq"));
        assertEquals("[시스템] 검토자님이 최종승인 처리했습니다.", historyCaptor.getAllValues().get(2).get("answerCnt"));

        ArgumentCaptor<Map> mainCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO, times(2)).updateElectronicApprovalMainStatus(mainCaptor.capture());
        assertEquals("approved", mainCaptor.getAllValues().get(1).get("statusType"));
        assertEquals("완료", mainCaptor.getAllValues().get(1).get("statusTypeName"));

        ArgumentCaptor<Map> lineCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO, times(2)).updateElectronicApprovalLineStatus(lineCaptor.capture());
        assertEquals(2, lineCaptor.getAllValues().get(0).get("exeSeq"));
        assertEquals("approved", lineCaptor.getAllValues().get(0).get("appStatus"));
        assertEquals(3, lineCaptor.getAllValues().get(1).get("exeSeq"));
        assertEquals("approved", lineCaptor.getAllValues().get(1).get("appStatus"));
    }

    @DisplayName("검토자만 같고 승인자가 다르면 결재신청 후 검토승인까지만 자동 처리된다")
    @Test
    void submitDraft_stopsAfterReviewWhenFinalApproverDiffers() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitChainTest(3001L, 4001L);

        HaccpWorkDraftSubmitRequestVO payload = new HaccpWorkDraftSubmitRequestVO();
        payload.setTitle("제출 테스트");

        Long approvalId = service.submitDraft(77L, "tenant_001", payload, "3001");

        assertEquals(77L, approvalId);
        verify(serviceHaccpWorkDAO, times(1)).updateElectronicApprovalLineStatus(anyMap());
        verify(serviceHaccpWorkDAO, times(1)).updateElectronicApprovalMainStatus(anyMap());
        verify(serviceHaccpWorkDAO, times(2)).insertElectronicApprovalHistoryMain(anyMap());
        verify(serviceHaccpWorkDAO, times(2)).selectApprovalLineLoginId(anyMap());
        verify(serviceHaccpWorkDAO, times(1)).updateElectronicApprovalLineArrival(anyMap());

        ArgumentCaptor<Map> historyCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO, times(2)).insertElectronicApprovalHistoryMain(historyCaptor.capture());
        assertEquals(1, historyCaptor.getAllValues().get(0).get("exeSeq"));
        assertEquals("[시스템] 검토자님이 결재신청 처리했습니다.", historyCaptor.getAllValues().get(0).get("answerCnt"));
        assertEquals(2, historyCaptor.getAllValues().get(1).get("exeSeq"));
        assertEquals("[시스템] 검토자님이 검토승인 처리했습니다.", historyCaptor.getAllValues().get(1).get("answerCnt"));

        ArgumentCaptor<Map> mainCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO, times(1)).updateElectronicApprovalMainStatus(mainCaptor.capture());
        assertEquals("in_progress", mainCaptor.getValue().get("statusType"));
        assertEquals("진행중", mainCaptor.getValue().get("statusTypeName"));

        ArgumentCaptor<Map> lineCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO, times(1)).updateElectronicApprovalLineStatus(lineCaptor.capture());
        assertEquals(2, lineCaptor.getValue().get("exeSeq"));
        assertEquals("approved", lineCaptor.getValue().get("appStatus"));

        ArgumentCaptor<Map> arrivalCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO, times(1)).updateElectronicApprovalLineArrival(arrivalCaptor.capture());
        assertEquals(3, arrivalCaptor.getValue().get("exeSeq"));
        assertEquals("승인요청", arrivalCaptor.getValue().get("optionName"));
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

    private HaccpWorkFlowServiceImpl createServiceForApprovalChainTest(Long reviewerLoginId, Long approverLoginId) throws Exception {
        HaccpWorkDraftService draftService = mock(HaccpWorkDraftService.class);
        serviceHaccpWorkDAO = mock(HaccpWorkDAO.class);
        HaccpWorkFlowServiceImpl service = new HaccpWorkFlowServiceImpl(draftService, serviceHaccpWorkDAO);

        when(serviceHaccpWorkDAO.selectTenantIdByCode("TENANT_001")).thenReturn(10L);
        when(serviceHaccpWorkDAO.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(reviewerLoginId);
        doAnswer(invocation -> {
            Map<String, Object> params = invocation.getArgument(0);
            params.put("electronicApprovalId", 77L);
            return null;
        }).when(serviceHaccpWorkDAO).insertElectronicApprovalMain(anyMap());

        Map<String, Object> actorProfile = new HashMap<String, Object>();
        actorProfile.put("userName", "검토자");
        when(serviceHaccpWorkDAO.selectApprovalActorProfile(anyMap())).thenReturn(actorProfile);

        Map<String, Object> approvalMain = new HashMap<String, Object>();
        approvalMain.put("electronicApprovalId", 77L);
        when(serviceHaccpWorkDAO.selectApprovalMainById(anyMap())).thenReturn(approvalMain);

        AtomicBoolean approverArrived = new AtomicBoolean(false);

        when(serviceHaccpWorkDAO.selectApprovalLineLoginId(anyMap())).thenAnswer(invocation -> {
            Map<String, Object> params = invocation.getArgument(0);
            Integer exeSeq = (Integer) params.get("exeSeq");
            if (exeSeq != null && exeSeq.intValue() == 2) {
                return reviewerLoginId;
            }
            if (exeSeq != null && exeSeq.intValue() == 3) {
                if (!approverArrived.get()) {
                    return null;
                }
                return approverLoginId;
            }
            return null;
        });

        when(serviceHaccpWorkDAO.selectFinalOwnerExeSeqByApprovalId(anyMap())).thenReturn(4);
        when(serviceHaccpWorkDAO.updateElectronicApprovalLineStatus(anyMap())).thenReturn(1);
        when(serviceHaccpWorkDAO.updateElectronicApprovalMainStatus(anyMap())).thenReturn(1);
        when(serviceHaccpWorkDAO.updateElectronicApprovalLineArrival(anyMap())).thenAnswer(invocation -> {
            Map<String, Object> params = invocation.getArgument(0);
            Integer exeSeq = (Integer) params.get("exeSeq");
            if (exeSeq != null && exeSeq.intValue() == 3) {
                approverArrived.set(true);
            }
            return 1;
        });

        when(serviceHaccpWorkDAO.selectApprovalLineForHistoryBySeq(anyMap())).thenAnswer(invocation -> {
            Map<String, Object> params = invocation.getArgument(0);
            Integer exeSeq = (Integer) params.get("exeSeq");
            Map<String, Object> historyLineInfo = new HashMap<String, Object>();
            historyLineInfo.put("electronicApprovalLineId", exeSeq != null && exeSeq.intValue() == 2 ? 100L : 200L);
            historyLineInfo.put("exeSeq", exeSeq);
            historyLineInfo.put("approvalType", "drafted");
            historyLineInfo.put("eabusNo", "001");
            historyLineInfo.put("eaExeId", "EA-001");
            return historyLineInfo;
        });
        when(serviceHaccpWorkDAO.selectNextApprovalHistoryAnswerSeq(anyMap())).thenReturn(1);

        when(draftService.getDraftTemplate(eq("TENANT_001"), eq(77L), eq("approval"), eq("3001")))
            .thenReturn(new HaccpWorkVO());

        return service;
    }

    private HaccpWorkFlowServiceImpl createServiceForSubmitChainTest(Long reviewerLoginId, Long approverLoginId) throws Exception {
        HaccpWorkDraftService draftService = mock(HaccpWorkDraftService.class);
        serviceHaccpWorkDAO = mock(HaccpWorkDAO.class);
        HaccpWorkFlowServiceImpl service = new HaccpWorkFlowServiceImpl(draftService, serviceHaccpWorkDAO);
        EgovIdGnrService idGnrService = mock(EgovIdGnrService.class);
        when(idGnrService.getNextStringId()).thenReturn("1");
        Field idGnrField = HaccpWorkFlowServiceImpl.class.getDeclaredField("electronicApprovalExeIdGnrService");
        idGnrField.setAccessible(true);
        idGnrField.set(service, idGnrService);

        when(serviceHaccpWorkDAO.selectTenantIdByCode("TENANT_001")).thenReturn(10L);
        when(serviceHaccpWorkDAO.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(reviewerLoginId);

        Map<String, Object> approvalMain = new HashMap<String, Object>();
        approvalMain.put("electronicApprovalId", 77L);
        approvalMain.put("eaExeId", "EA-001");
        when(serviceHaccpWorkDAO.selectApprovalMainById(anyMap())).thenReturn(approvalMain);

        Map<String, Object> actorProfile = new HashMap<String, Object>();
        actorProfile.put("userName", "검토자");
        when(serviceHaccpWorkDAO.selectApprovalActorProfile(anyMap())).thenReturn(actorProfile);

        when(serviceHaccpWorkDAO.selectLatestApprovalStatusByWorkAndLogin(anyMap())).thenReturn(new HashMap<String, Object>());
        when(serviceHaccpWorkDAO.selectLatestPreApplyApprovalIdByWorkAndLogin(anyMap())).thenReturn(77L);

        HaccpWorkVO draftWork = new HaccpWorkVO();
        draftWork.setReviewerId(reviewerLoginId);
        draftWork.setApproverId(approverLoginId);
        draftWork.setTemplateJson("{}");
        draftWork.setTemplateHtml("<p>본문</p>");
        when(draftService.getDraftTemplate(eq("TENANT_001"), eq(77L), eq("work"), eq("3001"))).thenReturn(draftWork);

        when(serviceHaccpWorkDAO.upsertElectronicApprovalLine(anyMap())).thenReturn(101L, 102L, 103L, 104L);
        AtomicBoolean approverArrived = new AtomicBoolean(false);

        when(serviceHaccpWorkDAO.selectApprovalLineLoginId(anyMap())).thenAnswer(invocation -> {
            Map<String, Object> params = invocation.getArgument(0);
            Integer exeSeq = (Integer) params.get("exeSeq");
            if (exeSeq != null && exeSeq.intValue() == 2) {
                return reviewerLoginId;
            }
            if (exeSeq != null && exeSeq.intValue() == 3) {
                if (!approverArrived.get()) {
                    return null;
                }
                return approverLoginId;
            }
            return null;
        });
        when(serviceHaccpWorkDAO.selectApprovalLineForHistoryBySeq(anyMap())).thenAnswer(invocation -> {
            Map<String, Object> params = invocation.getArgument(0);
            Integer exeSeq = (Integer) params.get("exeSeq");
            Map<String, Object> historyLineInfo = new HashMap<String, Object>();
            historyLineInfo.put("electronicApprovalLineId", exeSeq != null && exeSeq.intValue() == 2 ? 200L : 300L);
            historyLineInfo.put("exeSeq", exeSeq);
            historyLineInfo.put("approvalType", "drafted");
            historyLineInfo.put("eabusNo", "001");
            historyLineInfo.put("eaExeId", "EA-001");
            return historyLineInfo;
        });
        when(serviceHaccpWorkDAO.selectNextApprovalHistoryAnswerSeq(anyMap())).thenReturn(1);
        when(serviceHaccpWorkDAO.updateElectronicApprovalLineStatus(anyMap())).thenReturn(1);
        when(serviceHaccpWorkDAO.updateElectronicApprovalMainStatus(anyMap())).thenReturn(1);
        when(serviceHaccpWorkDAO.updateElectronicApprovalLineArrival(anyMap())).thenAnswer(invocation -> {
            Map<String, Object> params = invocation.getArgument(0);
            Integer exeSeq = (Integer) params.get("exeSeq");
            if (exeSeq != null && exeSeq.intValue() == 3) {
                approverArrived.set(true);
            }
            return 1;
        });
        when(serviceHaccpWorkDAO.clearUnusedReferenceApprovalLines(anyMap())).thenReturn(0);

        return service;
    }
}
