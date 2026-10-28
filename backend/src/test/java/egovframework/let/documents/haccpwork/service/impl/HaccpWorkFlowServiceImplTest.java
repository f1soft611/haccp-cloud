package egovframework.let.documents.haccpwork.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyChar;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.DayOfWeek;
import java.util.HashMap;
import java.lang.reflect.Field;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

import egovframework.let.documents.haccpwork.domain.model.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import egovframework.let.common.idgen.service.EgovConditionalIdService;
import egovframework.let.documents.haccpwork.domain.repository.HaccpWorkDAO;
import egovframework.let.documents.haccpwork.service.HaccpWorkDraftService;
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

    @DisplayName("기안번호는 일자별로 순번을 초기화한다")
    @Test
    void buildEaExeId_resetsSequenceByDate() throws Exception {
        HaccpWorkDraftService draftService = mock(HaccpWorkDraftService.class);
        HaccpWorkDAO haccpWorkDAO = mock(HaccpWorkDAO.class);
        HaccpWorkFlowServiceImpl service = new HaccpWorkFlowServiceImpl(draftService, haccpWorkDAO);

        EgovConditionalIdService idService = mock(EgovConditionalIdService.class);
        when(idService.getNextStringId(eq("EA_EXE_ID"), eq("20250825"), eq("SEQ"), eq("20250825"), eq(4), eq('0')))
            .thenReturn("202508250001");
        when(idService.getNextStringId(eq("EA_EXE_ID"), eq("20250826"), eq("SEQ"), eq("20250826"), eq(4), eq('0')))
            .thenReturn("202508260001");

        Field idGnrField = HaccpWorkFlowServiceImpl.class.getDeclaredField("electronicApprovalExeIdGnrService");
        idGnrField.setAccessible(true);
        idGnrField.set(service, idService);

        java.lang.reflect.Method buildMethod = HaccpWorkFlowServiceImpl.class.getDeclaredMethod("buildEaExeId", java.time.LocalDate.class);
        buildMethod.setAccessible(true);

        assertEquals("202508250001", buildMethod.invoke(service, java.time.LocalDate.of(2025, 8, 25)));
        assertEquals("202508260001", buildMethod.invoke(service, java.time.LocalDate.of(2025, 8, 26)));
        verify(idService).getNextStringId(eq("EA_EXE_ID"), eq("20250825"), eq("SEQ"), eq("20250825"), eq(4), eq('0'));
        verify(idService).getNextStringId(eq("EA_EXE_ID"), eq("20250826"), eq("SEQ"), eq("20250826"), eq(4), eq('0'));
    }

    @DisplayName("기안선 생성 시 arrival_at/exe_at/open_at은 null이 아니어야 한다")
    @Test
    void rebuildPreApplyApprovalLines_setsRequiredTimestamps() throws Exception {
        HaccpWorkDraftService draftService = mock(HaccpWorkDraftService.class);
        HaccpWorkDAO haccpWorkDAO = mock(HaccpWorkDAO.class);
        HaccpWorkFlowServiceImpl service = new HaccpWorkFlowServiceImpl(draftService, haccpWorkDAO);

        when(haccpWorkDAO.upsertElectronicApprovalLine(anyMap())).thenReturn(101L, 102L, 103L, 104L);

        java.lang.reflect.Method method = HaccpWorkFlowServiceImpl.class.getDeclaredMethod(
                "rebuildPreApplyApprovalLines",
                Long.class,
                Long.class,
                Long.class,
                Long.class,
                Long.class,
                Map.class,
                Map.class,
                Map.class,
                java.util.List.class,
                java.time.LocalDateTime.class,
                String.class);
        method.setAccessible(true);

        LocalDateTime now = LocalDateTime.of(2026, 8, 25, 13, 44, 5, 285379000);
        Map<String, Object> drafterProfile = new HashMap<String, Object>();
        drafterProfile.put("departmentId", 1L);
        Map<String, Object> reviewerProfile = new HashMap<String, Object>();
        reviewerProfile.put("departmentId", 2L);
        Map<String, Object> approverProfile = new HashMap<String, Object>();
        approverProfile.put("departmentId", 3L);

        method.invoke(service, 1L, 37L, 1L, 2L, 3L, drafterProfile, reviewerProfile, approverProfile, java.util.Collections.emptyList(), now, "202608250002");

        ArgumentCaptor<Map> insertCaptor = ArgumentCaptor.forClass(Map.class);
        verify(haccpWorkDAO, times(4)).upsertElectronicApprovalLine(insertCaptor.capture());
        for (Map<String, Object> params : insertCaptor.getAllValues()) {
            assertTrue(params.get("arrivalAt") != null);
            assertTrue(params.get("exeAt") != null);
            assertTrue(params.get("openAt") != null);
            assertEquals(now, params.get("arrivalAt"));
            assertEquals(now, params.get("exeAt"));
            assertEquals(now, params.get("openAt"));
        }
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

    @DisplayName("결재 미적용 문서는 결재취소 한 번에 기안 단계까지 되돌려 미완료가 된다")
    @Test
    void updateApprovalStatus_submitCancelNoApprovalApply_revertsToPreApply() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitCancelMessageTest(3);
        serviceCancelWork.setApprovalApply(Boolean.FALSE);

        HaccpWorkApprovalStatusUpdateRequestVO payload = new HaccpWorkApprovalStatusUpdateRequestVO();
        payload.setEventType("submit_cancel");

        service.updateApprovalStatus(77L, "tenant_001", payload, "3001");

        ArgumentCaptor<Map> lineCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO).updateElectronicApprovalLineStatus(lineCaptor.capture());
        assertEquals(1, lineCaptor.getValue().get("exeSeq"));
        assertEquals("cancelled", lineCaptor.getValue().get("appStatus"));

        ArgumentCaptor<Map> mainCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO).updateElectronicApprovalMainStatus(mainCaptor.capture());
        assertEquals("pre_apply", mainCaptor.getValue().get("statusType"));
        assertEquals("pre_apply", mainCaptor.getValue().get("endStatus"));
        assertEquals("미완료", mainCaptor.getValue().get("statusTypeName"));

        ArgumentCaptor<Map> pendingCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO, times(2)).updateElectronicApprovalLineToPending(pendingCaptor.capture());
        assertEquals(2, pendingCaptor.getAllValues().get(0).get("exeSeq"));
        assertEquals(3, pendingCaptor.getAllValues().get(1).get("exeSeq"));
        verify(serviceHaccpWorkDAO, never()).updateElectronicApprovalLineArrival(anyMap());

        ArgumentCaptor<Map> historyCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO).insertElectronicApprovalHistoryMain(historyCaptor.capture());
        // 기존 -> "[시스템] 최종승인자님이 상신취소 처리했습니다." / 변경 -> 결재취소 문구
        assertEquals("[시스템] 최종승인자님이 결재취소 처리했습니다.", historyCaptor.getValue().get("answerCnt"));
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

    // 기존 -> 결재 미적용 문서는 기안자 결재선만 만든다 / 변경 -> 검토/승인 결재선도 기안자로 만들고 승인 처리한다
    @DisplayName("결재 미적용 문서는 결재신청 시 검토/승인 결재선도 기안자로 승인 처리하고 바로 완료 상태가 된다")
    @Test
    void submitDraft_noApprovalApply_completesWithDrafterAsAllSigners() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitChainTest(3001L, 4001L);
        serviceDraftWork.setApprovalApply(Boolean.FALSE);
        serviceDraftWork.setReviewerId(null);
        serviceDraftWork.setApproverId(null);

        HaccpWorkDraftSubmitRequestVO payload = new HaccpWorkDraftSubmitRequestVO();
        payload.setTitle("결재 미적용 저장");
        payload.setApprovalId(77L);

        Long approvalId = service.submitDraft(77L, "tenant_001", payload, "3001");

        assertEquals(77L, approvalId);

        ArgumentCaptor<Map> updateCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO).updateElectronicApprovalMainDraftContent(updateCaptor.capture());
        assertEquals("approved", updateCaptor.getValue().get("statusType"));
        assertEquals("approved", updateCaptor.getValue().get("endStatus"));
        assertEquals("완료", updateCaptor.getValue().get("statusTypeName"));

        ArgumentCaptor<Map> lineCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO, times(3)).upsertElectronicApprovalLine(lineCaptor.capture());
        List<Map> lines = lineCaptor.getAllValues();
        for (int i = 0; i < 3; i++) {
            assertEquals(i + 1, lines.get(i).get("exeSeq"));
            assertEquals(3001L, lines.get(i).get("loginId"));
            assertEquals("approved", lines.get(i).get("appStatus"));
            assertNotNull(lines.get(i).get("exeAt"));
        }
        assertEquals("검토", lines.get(1).get("stageName"));
        assertEquals("N", lines.get(1).get("lastCnfrmerStatus"));
        assertEquals("승인", lines.get(2).get("stageName"));
        assertEquals("Y", lines.get(2).get("lastCnfrmerStatus"));

        verify(serviceHaccpWorkDAO, never()).clearUnusedReferenceApprovalLines(anyMap());
        verify(serviceHaccpWorkDAO, never()).updateElectronicApprovalMainStatus(anyMap());
    }

    @DisplayName("결재신청 시 다음 결재자는 arrival만 세팅되고 exe/open은 대기 상태를 유지한다")
    @Test
    void submitDraft_keepsNextApproverPendingUntilAction() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitChainTest(3001L, 4001L);

        HaccpWorkDraftSubmitRequestVO payload = new HaccpWorkDraftSubmitRequestVO();
        payload.setTitle("제출 테스트");

        service.submitDraft(77L, "tenant_001", payload, "3001");

        ArgumentCaptor<Map> upsertCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO, times(4)).upsertElectronicApprovalLine(upsertCaptor.capture());

        Map<String, Object> drafterLine = upsertCaptor.getAllValues().get(0);
        assertTrue(drafterLine.get("arrivalAt") != null);
        assertTrue(drafterLine.get("exeAt") != null);
        assertTrue(drafterLine.get("openAt") != null);

        for (int i = 1; i < upsertCaptor.getAllValues().size(); i++) {
            Map<String, Object> params = upsertCaptor.getAllValues().get(i);
            assertTrue(params.get("arrivalAt") != null);
            assertTrue(params.get("exeAt") == null);
            assertTrue(params.get("openAt") == null);
        }
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

    @DisplayName("기존 임시저장 문서 결재신청 시 twf_date만 갱신되고 reg_date(작성일)는 유지된다")
    @Test
    void submitDraft_updatesDraftDateFieldsWhenReSubmittingExistingPreApply() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitChainTest(3001L, 4001L);

        HaccpWorkDraftSubmitRequestVO payload = new HaccpWorkDraftSubmitRequestVO();
        payload.setTitle("재결재 신청 테스트");
        payload.setApprovalId(77L);

        service.submitDraft(77L, "tenant_001", payload, "3001");

        ArgumentCaptor<Map> updateCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO).updateElectronicApprovalMainDraftContent(updateCaptor.capture());

        Object twfDate = updateCaptor.getValue().get("twfDate");
        Object afterTwfDate = updateCaptor.getValue().get("afterTwfDate");

        assertTrue(updateCaptor.getValue().get("regDate") == null);
        assertTrue(twfDate instanceof String && ((String) twfDate).matches("^\\d{8}$"));
        assertTrue(afterTwfDate instanceof String && ((String) afterTwfDate).matches("^\\d{8}$"));
        // 기존 -> 없음 / 변경 -> 기존 기안번호(EA-001)가 있으면 새로 채번하지 않는다
        verify(serviceIdGnrService, never()).getNextStringId(anyString(), anyString(), anyString(), anyString(), anyInt(), anyChar());
    }

    // 기존 -> submitDraft_looksUpSameCycle (주기 최신 임시저장, 결재 상태 조회 파라미터 검증)
    // 변경 -> 주기 조회가 없어졌으므로 요청 주기가 report_date 로 저장되는지만 검증
    @DisplayName("결재신청 시 요청 주기(cycle_date) 시작일이 report_date 로 저장된다")
    @Test
    void submitDraft_savesRequestedCycleAsReportDate() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitChainTest(3001L, 4001L);
        LocalDate pastDay = LocalDate.now().minusDays(3);

        HaccpWorkDraftSubmitRequestVO payload = new HaccpWorkDraftSubmitRequestVO();
        payload.setTitle("지연 작성 테스트");
        payload.setCycleDate(pastDay.toString());
        payload.setApprovalId(77L);

        service.submitDraft(77L, "tenant_001", payload, "3001");

        ArgumentCaptor<Map> updateCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO).updateElectronicApprovalMainDraftContent(updateCaptor.capture());
        assertEquals(pastDay.format(DateTimeFormatter.BASIC_ISO_DATE), updateCaptor.getValue().get("reportDate"));
    }

    @DisplayName("미래 주기로 결재신청하면 400 오류를 내고 저장하지 않는다")
    @Test
    void submitDraft_rejectsFutureCycle() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitChainTest(3001L, 4001L);

        HaccpWorkDraftSubmitRequestVO payload = new HaccpWorkDraftSubmitRequestVO();
        payload.setTitle("미래 작성 테스트");
        payload.setCycleDate(LocalDate.now().plusDays(1).toString());

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.submitDraft(77L, "tenant_001", payload, "3001"));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(serviceHaccpWorkDAO, never()).insertElectronicApprovalMain(anyMap());
        verify(serviceHaccpWorkDAO, never()).updateElectronicApprovalMainDraftContent(anyMap());
    }

    @DisplayName("임시저장 신규 INSERT 시 report_date는 주기 기준일(cycle_date), reg_date는 오늘이다")
    @Test
    void saveTempDraft_insertSetsReportDateToCycleDate() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitChainTest(3001L, 4001L);
        when(serviceHaccpWorkDAO.selectLatestPreApplyApprovalIdByWorkAndLogin(anyMap())).thenReturn(null);
        doAnswer(invocation -> {
            Map<String, Object> params = invocation.getArgument(0);
            params.put("electronicApprovalId", 88L);
            return null;
        }).when(serviceHaccpWorkDAO).insertElectronicApprovalMain(anyMap());
        LocalDate pastDay = LocalDate.now().minusDays(3);

        HaccpWorkDraftTempSaveRequestVO payload = new HaccpWorkDraftTempSaveRequestVO();
        payload.setTitle("지연 임시저장 테스트");
        payload.setCycleDate(pastDay.toString());

        service.saveTempDraft(77L, "tenant_001", payload, "3001");

        ArgumentCaptor<Map> insertCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO).insertElectronicApprovalMain(insertCaptor.capture());
        assertEquals(pastDay.format(DateTimeFormatter.BASIC_ISO_DATE), insertCaptor.getValue().get("reportDate"));
        assertTrue(!insertCaptor.getValue().containsKey("cycleDate"));
        assertEquals(LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE), insertCaptor.getValue().get("regDate"));
    }

    @DisplayName("결재신청 신규 INSERT 시 report_date는 주기 기준일(cycle_date)이다")
    @Test
    void submitDraft_insertSetsReportDateToCycleDate() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitChainTest(3001L, 4001L);
        when(serviceHaccpWorkDAO.selectLatestPreApplyApprovalIdByWorkAndLogin(anyMap())).thenReturn(null);
        doAnswer(invocation -> {
            Map<String, Object> params = invocation.getArgument(0);
            params.put("electronicApprovalId", 77L);
            return null;
        }).when(serviceHaccpWorkDAO).insertElectronicApprovalMain(anyMap());
        LocalDate pastDay = LocalDate.now().minusDays(3);

        HaccpWorkDraftSubmitRequestVO payload = new HaccpWorkDraftSubmitRequestVO();
        payload.setTitle("지연 결재신청 테스트");
        payload.setCycleDate(pastDay.toString());

        service.submitDraft(77L, "tenant_001", payload, "3001");

        ArgumentCaptor<Map> insertCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO).insertElectronicApprovalMain(insertCaptor.capture());
        assertEquals(pastDay.format(DateTimeFormatter.BASIC_ISO_DATE), insertCaptor.getValue().get("reportDate"));
        // 기존 -> 없음 / 변경 -> 바로 결재신청(신규 INSERT)은 채번 1회
        verify(serviceIdGnrService, times(1)).getNextStringId(anyString(), anyString(), anyString(), anyString(), anyInt(), anyChar());
        assertEquals("202608250001", insertCaptor.getValue().get("eaExeId"));
    }

    @DisplayName("임시저장 시 보고일자를 다른 주기로 바꾸면 지정한 임시저장 건의 report_date 를 새 주기로 UPDATE 한다")
    @Test
    void saveTempDraft_movesExistingDraftToReportDateCycle() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitChainTest(3001L, 4001L);
        LocalDate target = LocalDate.now().minusDays(3);

        HaccpWorkDraftTempSaveRequestVO payload = new HaccpWorkDraftTempSaveRequestVO();
        payload.setTitle("보고일자 이동 테스트");
        payload.setReportDate(target.toString());
        // 기존 -> selectLatestPreApplyApprovalIdByWorkAndLogin 스텁으로 원래 주기 임시저장(77) 지정
        // 변경 -> 요청 approvalId 로 지정
        payload.setApprovalId(77L);

        service.saveTempDraft(77L, "tenant_001", payload, "3001");

        ArgumentCaptor<Map> updateCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO).updateElectronicApprovalMainDraftContent(updateCaptor.capture());
        assertEquals(77L, updateCaptor.getValue().get("approvalId"));
        assertEquals(target.format(DateTimeFormatter.BASIC_ISO_DATE), updateCaptor.getValue().get("reportDate"));
        verify(serviceHaccpWorkDAO, never()).insertElectronicApprovalMain(anyMap());
    }

    @DisplayName("주간 업무 임시저장 시 보고일자 수요일은 그 주 월요일로 저장된다")
    @Test
    void saveTempDraft_weeklyReportDateSnapsToMonday() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitChainTest(3001L, 4001L);
        serviceDraftWork.setCycle("WEEK");
        when(serviceHaccpWorkDAO.selectLatestPreApplyApprovalIdByWorkAndLogin(anyMap())).thenReturn(null);
        doAnswer(invocation -> {
            Map<String, Object> params = invocation.getArgument(0);
            params.put("electronicApprovalId", 88L);
            return null;
        }).when(serviceHaccpWorkDAO).insertElectronicApprovalMain(anyMap());
        LocalDate wednesday = LocalDate.now().minusWeeks(2).with(DayOfWeek.WEDNESDAY);

        HaccpWorkDraftTempSaveRequestVO payload = new HaccpWorkDraftTempSaveRequestVO();
        payload.setTitle("주간 보고일자 테스트");
        payload.setReportDate(wednesday.toString());

        service.saveTempDraft(77L, "tenant_001", payload, "3001");

        ArgumentCaptor<Map> insertCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO).insertElectronicApprovalMain(insertCaptor.capture());
        assertEquals(
                wednesday.with(DayOfWeek.MONDAY).format(DateTimeFormatter.BASIC_ISO_DATE),
                insertCaptor.getValue().get("reportDate"));
        assertTrue(!insertCaptor.getValue().containsKey("cycleDate"));
    }

    // 기존 -> submitDraft_rejectsReportDateCycleWithOtherDraft (대상 주기에 임시저장 있으면 409)
    // 변경 -> 같은 주기 여러 건 허용이라 approvalId 없으면 새 문서로 INSERT
    @DisplayName("approvalId 없이 결재신청하면 같은 주기에 다른 문서가 있어도 새 문서로 INSERT 한다")
    @Test
    void submitDraft_withoutApprovalIdInsertsNewDocument() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitChainTest(3001L, 4001L);
        LocalDate target = LocalDate.now().minusDays(3);

        HaccpWorkDraftSubmitRequestVO payload = new HaccpWorkDraftSubmitRequestVO();
        payload.setTitle("같은 주기 두번째 문서");
        payload.setReportDate(target.toString());

        service.submitDraft(77L, "tenant_001", payload, "3001");

        ArgumentCaptor<Map> insertCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO).insertElectronicApprovalMain(insertCaptor.capture());
        assertEquals(target.format(DateTimeFormatter.BASIC_ISO_DATE), insertCaptor.getValue().get("reportDate"));
        verify(serviceHaccpWorkDAO, never()).updateElectronicApprovalMainDraftContent(anyMap());
    }

    // 기존 -> submitDraft_rejectsReportDateCycleInProgress (대상 주기에 진행중 문서 있으면 409)
    // 변경 -> 수정 대상으로 지정한 문서가 임시저장이 아니면 409
    @DisplayName("결재신청 시 approvalId 문서가 임시저장 상태가 아니면 409 오류를 내고 저장하지 않는다")
    @Test
    void submitDraft_rejectsNonPreApplyApprovalId() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitChainTest(3001L, 4001L);
        Map<String, Object> inProgress = new HashMap<String, Object>();
        inProgress.put("electronicApprovalId", 77L);
        inProgress.put("draftingWorkCategoryId", 77L);
        inProgress.put("loginId", 3001L);
        inProgress.put("statusType", "in_progress");
        when(serviceHaccpWorkDAO.selectApprovalMainById(anyMap())).thenReturn(inProgress);

        HaccpWorkDraftSubmitRequestVO payload = new HaccpWorkDraftSubmitRequestVO();
        payload.setTitle("진행중 문서 수정 시도");
        payload.setApprovalId(77L);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.submitDraft(77L, "tenant_001", payload, "3001"));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        verify(serviceHaccpWorkDAO, never()).insertElectronicApprovalMain(anyMap());
        verify(serviceHaccpWorkDAO, never()).updateElectronicApprovalMainDraftContent(anyMap());
    }

    @DisplayName("임시저장 시 approvalId 문서가 다른 사람 기안이면 404 오류를 내고 저장하지 않는다")
    @Test
    void saveTempDraft_rejectsOtherOwnersApprovalId() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitChainTest(3001L, 4001L);
        Map<String, Object> othersDraft = new HashMap<String, Object>();
        othersDraft.put("electronicApprovalId", 77L);
        othersDraft.put("draftingWorkCategoryId", 77L);
        othersDraft.put("loginId", 4001L);
        othersDraft.put("statusType", "pre_apply");
        when(serviceHaccpWorkDAO.selectApprovalMainById(anyMap())).thenReturn(othersDraft);

        HaccpWorkDraftTempSaveRequestVO payload = new HaccpWorkDraftTempSaveRequestVO();
        payload.setTitle("남의 임시저장 수정 시도");
        payload.setApprovalId(77L);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.saveTempDraft(77L, "tenant_001", payload, "3001"));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        verify(serviceHaccpWorkDAO, never()).insertElectronicApprovalMain(anyMap());
        verify(serviceHaccpWorkDAO, never()).updateElectronicApprovalMainDraftContent(anyMap());
    }

    @DisplayName("미래 주기 보고일자로 임시저장하면 400 오류를 내고 저장하지 않는다")
    @Test
    void saveTempDraft_rejectsFutureReportDate() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitChainTest(3001L, 4001L);

        HaccpWorkDraftTempSaveRequestVO payload = new HaccpWorkDraftTempSaveRequestVO();
        payload.setTitle("미래 보고일자 테스트");
        payload.setReportDate(LocalDate.now().plusDays(1).toString());

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.saveTempDraft(77L, "tenant_001", payload, "3001"));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(serviceHaccpWorkDAO, never()).insertElectronicApprovalMain(anyMap());
        verify(serviceHaccpWorkDAO, never()).updateElectronicApprovalMainDraftContent(anyMap());
    }


    private HaccpWorkApprovalSubVO calibSub() {
        HaccpWorkApprovalSubVO sub = new HaccpWorkApprovalSubVO();
        sub.setEquipmentId(501L);
        sub.setInspectedDate("2026-10-01");
        sub.setExpirationDate("2027-10-01");
        return sub;
    }

    @DisplayName("HCP 업무 결재신청에 sub 가 없으면 400 을 내고 main 도 저장하지 않는다")
    @Test
    void submitDraft_hcpWithoutSub_rejectsBeforeSave() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitChainTest(3001L, 4001L);
        serviceDraftWork.setCategoryCode("HCP-CALIB");

        HaccpWorkDraftSubmitRequestVO payload = new HaccpWorkDraftSubmitRequestVO();
        payload.setTitle("검교정 기안");

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.submitDraft(77L, "tenant_001", payload, "3001"));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("필수값을 입력하세요.", ex.getReason());
        verify(serviceHaccpWorkDAO, never()).insertElectronicApprovalMain(anyMap());
        verify(serviceHaccpWorkDAO, never()).updateElectronicApprovalMainDraftContent(anyMap());
        verify(serviceHaccpWorkDAO, never()).insertElectronicApprovalSub(anyMap());
    }

    @DisplayName("HCP 업무 결재신청은 기존 sub 를 UPDATE 하고 INSERT 하지 않는다")
    @Test
    void submitDraft_hcpUpdatesExistingSub() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitChainTest(3001L, 4001L);
        serviceDraftWork.setCategoryCode("HCP-CALIB");
        when(serviceHaccpWorkDAO.updateElectronicApprovalSub(anyMap())).thenReturn(1);

        HaccpWorkDraftSubmitRequestVO payload = new HaccpWorkDraftSubmitRequestVO();
        payload.setTitle("검교정 기안");
        payload.setSub(calibSub());

        service.submitDraft(77L, "tenant_001", payload, "3001");

        ArgumentCaptor<Map> subCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO).updateElectronicApprovalSub(subCaptor.capture());
        assertEquals(10L, subCaptor.getValue().get("tenantId"));
        assertEquals(77L, subCaptor.getValue().get("approvalId"));
        assertEquals(77L, subCaptor.getValue().get("workId"));
        assertEquals(501L, subCaptor.getValue().get("equipmentId"));
        assertEquals("20261001", subCaptor.getValue().get("inspectedDate"));
        assertEquals("20271001", subCaptor.getValue().get("expirationDate"));
        verify(serviceHaccpWorkDAO, never()).insertElectronicApprovalSub(anyMap());
    }

    @DisplayName("만료일 관리 업무는 화면 보고일자 대신 검사일을 report_date 로 저장한다")
    @Test
    void submitDraft_hcpSavesInspectedDateAsReportDate() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitChainTest(3001L, 4001L);
        serviceDraftWork.setCategoryCode("HCP-CALIB");
        serviceDraftWork.setCycle("HALF");
        when(serviceHaccpWorkDAO.updateElectronicApprovalSub(anyMap())).thenReturn(1);

        HaccpWorkDraftSubmitRequestVO payload = new HaccpWorkDraftSubmitRequestVO();
        payload.setTitle("검교정 기안");
        payload.setReportDate("2026-07-01");
        payload.setSub(calibSub());

        service.submitDraft(77L, "tenant_001", payload, "3001");

        ArgumentCaptor<Map> insertCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO).insertElectronicApprovalMain(insertCaptor.capture());
        assertEquals("20261001", insertCaptor.getValue().get("reportDate"));
    }

    @DisplayName("만료일 관리 업무 임시저장도 검사일을 report_date 로 저장한다")
    @Test
    void saveTempDraft_hcpSavesInspectedDateAsReportDate() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitChainTest(3001L, 4001L);
        serviceDraftWork.setCategoryCode("HCP-CALIB");
        serviceDraftWork.setCycle("HALF");
        when(serviceHaccpWorkDAO.updateElectronicApprovalSub(anyMap())).thenReturn(1);
        doAnswer(invocation -> {
            Map<String, Object> params = invocation.getArgument(0);
            params.put("electronicApprovalId", 88L);
            return null;
        }).when(serviceHaccpWorkDAO).insertElectronicApprovalMain(anyMap());

        HaccpWorkDraftTempSaveRequestVO payload = new HaccpWorkDraftTempSaveRequestVO();
        payload.setTitle("검교정 임시저장");
        payload.setSub(calibSub());

        service.saveTempDraft(77L, "tenant_001", payload, "3001");

        ArgumentCaptor<Map> insertCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO).insertElectronicApprovalMain(insertCaptor.capture());
        assertEquals("20261001", insertCaptor.getValue().get("reportDate"));
    }

    @DisplayName("만료일 관리 업무 검사일이 미래 주기면 400")
    @Test
    void saveTempDraft_hcpRejectsFutureInspectedDate() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitChainTest(3001L, 4001L);
        serviceDraftWork.setCategoryCode("HCP-CALIB");
        serviceDraftWork.setCycle("HALF");
        HaccpWorkApprovalSubVO sub = calibSub();
        sub.setInspectedDate(LocalDate.now().plusYears(1).toString());
        sub.setExpirationDate(LocalDate.now().plusYears(2).toString());

        HaccpWorkDraftTempSaveRequestVO payload = new HaccpWorkDraftTempSaveRequestVO();
        payload.setTitle("검교정 임시저장");
        payload.setSub(sub);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.saveTempDraft(77L, "tenant_001", payload, "3001"));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(serviceHaccpWorkDAO, never()).insertElectronicApprovalMain(anyMap());
    }

    @DisplayName("HCP 업무 임시저장은 sub 행이 없으면 INSERT 한다")
    @Test
    void saveTempDraft_hcpInsertsSubWhenMissing() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitChainTest(3001L, 4001L);
        serviceDraftWork.setCategoryCode("HCP-CALIB");
        when(serviceHaccpWorkDAO.updateElectronicApprovalSub(anyMap())).thenReturn(0);

        HaccpWorkDraftTempSaveRequestVO payload = new HaccpWorkDraftTempSaveRequestVO();
        payload.setTitle("검교정 임시저장");
        payload.setSub(calibSub());

        service.saveTempDraft(77L, "tenant_001", payload, "3001");

        ArgumentCaptor<Map> insertCaptor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO).insertElectronicApprovalSub(insertCaptor.capture());
        assertEquals(77L, insertCaptor.getValue().get("approvalId"));
        assertEquals(501L, insertCaptor.getValue().get("equipmentId"));
    }

    @DisplayName("HCP 업무 임시저장도 sub 필수값이 없으면 400")
    @Test
    void saveTempDraft_hcpWithoutSub_rejects() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitChainTest(3001L, 4001L);
        serviceDraftWork.setCategoryCode("HCP-HCERT");

        HaccpWorkDraftTempSaveRequestVO payload = new HaccpWorkDraftTempSaveRequestVO();
        payload.setTitle("보건증 임시저장");
        payload.setSub(new HaccpWorkApprovalSubVO());

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.saveTempDraft(77L, "tenant_001", payload, "3001"));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(serviceHaccpWorkDAO, never()).updateElectronicApprovalMainDraftContent(anyMap());
    }

    @DisplayName("결재 미적용 HCP 업무도 저장 시 sub 를 저장한다")
    @Test
    void submitDraft_noApprovalApply_hcpSavesSub() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitChainTest(3001L, 4001L);
        serviceDraftWork.setApprovalApply(Boolean.FALSE);
        serviceDraftWork.setReviewerId(null);
        serviceDraftWork.setApproverId(null);
        serviceDraftWork.setCategoryCode("HCP-CALIB");
        when(serviceHaccpWorkDAO.updateElectronicApprovalSub(anyMap())).thenReturn(1);

        HaccpWorkDraftSubmitRequestVO payload = new HaccpWorkDraftSubmitRequestVO();
        payload.setTitle("검교정 저장");
        payload.setSub(calibSub());

        service.submitDraft(77L, "tenant_001", payload, "3001");

        verify(serviceHaccpWorkDAO).updateElectronicApprovalSub(anyMap());
    }

    @DisplayName("HCP 업무가 아니면 sub 가 와도 검증하지 않고 저장하지 않는다")
    @Test
    void submitDraft_nonHcpIgnoresSub() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForSubmitChainTest(3001L, 4001L);
        serviceDraftWork.setCategoryCode("HA");

        HaccpWorkDraftSubmitRequestVO payload = new HaccpWorkDraftSubmitRequestVO();
        payload.setTitle("일반 기안");
        payload.setSub(new HaccpWorkApprovalSubVO());

        service.submitDraft(77L, "tenant_001", payload, "3001");

        verify(serviceHaccpWorkDAO, never()).updateElectronicApprovalSub(anyMap());
        verify(serviceHaccpWorkDAO, never()).insertElectronicApprovalSub(anyMap());
    }

    private HaccpWorkFlowServiceImpl createServiceForDeleteDraftTest(Map<String, Object> approvalMain) throws Exception {
        HaccpWorkDraftService draftService = mock(HaccpWorkDraftService.class);
        serviceHaccpWorkDAO = mock(HaccpWorkDAO.class);
        HaccpWorkFlowServiceImpl service = new HaccpWorkFlowServiceImpl(draftService, serviceHaccpWorkDAO);
        when(serviceHaccpWorkDAO.selectTenantIdByCode("TENANT_001")).thenReturn(10L);
        when(serviceHaccpWorkDAO.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(3001L);
        when(serviceHaccpWorkDAO.selectApprovalMainById(anyMap())).thenReturn(approvalMain);
        when(serviceHaccpWorkDAO.softDeleteElectronicApprovalMain(anyMap())).thenReturn(1);
        return service;
    }

    private Map<String, Object> approvalMainRow(Long loginId, String statusType) {
        // 기존 -> camelCase 키 / 변경 -> PostgreSQL이 실제로 반환하는 소문자 키
        Map<String, Object> row = new HashMap<String, Object>();
        row.put("electronicapprovalid", 77L);
        row.put("loginid", loginId);
        row.put("statustype", statusType);
        row.put("eaexeid", "202610200001");
        return row;
    }

    @DisplayName("본인 임시저장 기안은 소프트 삭제된다")
    @Test
    void deleteDraft_softDeletesOwnPreApply() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForDeleteDraftTest(approvalMainRow(3001L, "pre_apply"));

        service.deleteDraft(77L, "tenant_001", "3001");

        ArgumentCaptor<Map> captor = ArgumentCaptor.forClass(Map.class);
        verify(serviceHaccpWorkDAO).softDeleteElectronicApprovalMain(captor.capture());
        assertEquals(10L, captor.getValue().get("tenantId"));
        assertEquals(77L, captor.getValue().get("approvalId"));
        assertEquals(3001L, captor.getValue().get("updatedBy"));
        assertTrue(captor.getValue().get("updatedAt") instanceof LocalDateTime);
    }

    @DisplayName("없는(또는 이미 삭제된) 기안 삭제는 404")
    @Test
    void deleteDraft_notFound() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForDeleteDraftTest(null);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.deleteDraft(77L, "tenant_001", "3001"));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        verify(serviceHaccpWorkDAO, never()).softDeleteElectronicApprovalMain(anyMap());
    }

    @DisplayName("다른 사람이 작성한 기안 삭제는 403")
    @Test
    void deleteDraft_rejectsOtherOwner() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForDeleteDraftTest(approvalMainRow(4001L, "pre_apply"));

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.deleteDraft(77L, "tenant_001", "3001"));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        verify(serviceHaccpWorkDAO, never()).softDeleteElectronicApprovalMain(anyMap());
    }

    @DisplayName("임시저장이 아닌 기안(결재진행중) 삭제는 409")
    @Test
    void deleteDraft_rejectsNonPreApply() throws Exception {
        HaccpWorkFlowServiceImpl service = createServiceForDeleteDraftTest(approvalMainRow(3001L, "in_progress"));

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.deleteDraft(77L, "tenant_001", "3001"));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        verify(serviceHaccpWorkDAO, never()).softDeleteElectronicApprovalMain(anyMap());
    }

    private HaccpWorkDAO serviceHaccpWorkDAO;

    // 기존 -> 없음 / 변경 -> 결재신청 시 기안번호 채번 횟수 검증용
    private EgovConditionalIdService serviceIdGnrService;

    private HaccpWorkVO serviceDraftWork;
    private HaccpWorkVO serviceCancelWork;

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
        serviceCancelWork = new HaccpWorkVO();
        when(draftService.getDraftTemplate(eq("TENANT_001"), eq(77L), eq("approval"), eq("3001")))
                .thenReturn(serviceCancelWork);

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
        // 기존 -> 지역 변수 idGnrService / 변경 -> 채번 호출 여부 검증을 위해 필드로 보관
        serviceIdGnrService = mock(EgovConditionalIdService.class);
        when(serviceIdGnrService.getNextStringId(eq("EA_EXE_ID"), anyString(), eq("SEQ"), anyString(), eq(4), eq('0')))
            .thenReturn("202608250001");
        Field idGnrField = HaccpWorkFlowServiceImpl.class.getDeclaredField("electronicApprovalExeIdGnrService");
        idGnrField.setAccessible(true);
        idGnrField.set(service, serviceIdGnrService);

        when(serviceHaccpWorkDAO.selectTenantIdByCode("TENANT_001")).thenReturn(10L);
        when(serviceHaccpWorkDAO.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(reviewerLoginId);

        Map<String, Object> approvalMain = new HashMap<String, Object>();
        approvalMain.put("electronicApprovalId", 77L);
        approvalMain.put("eaExeId", "EA-001");
        approvalMain.put("draftingWorkCategoryId", 77L);
        approvalMain.put("loginId", reviewerLoginId);
        approvalMain.put("statusType", "pre_apply");
        when(serviceHaccpWorkDAO.selectApprovalMainById(anyMap())).thenReturn(approvalMain);

        Map<String, Object> actorProfile = new HashMap<String, Object>();
        actorProfile.put("userName", "검토자");
        when(serviceHaccpWorkDAO.selectApprovalActorProfile(anyMap())).thenReturn(actorProfile);

        // 기존 -> selectLatestApprovalStatusByWorkAndLogin, selectLatestPreApplyApprovalIdByWorkAndLogin(77) 스텁 (주기 최신 문서 기준 저장)
        // 변경 -> approvalId 없으면 항상 INSERT 하므로 신규 키 77 을 돌려주는 기본 스텁
        doAnswer(invocation -> {
            Map<String, Object> params = invocation.getArgument(0);
            params.put("electronicApprovalId", 77L);
            return null;
        }).when(serviceHaccpWorkDAO).insertElectronicApprovalMain(anyMap());

        HaccpWorkVO draftWork = new HaccpWorkVO();
        draftWork.setReviewerId(reviewerLoginId);
        draftWork.setApproverId(approverLoginId);
        draftWork.setTemplateJson("{}");
        draftWork.setTemplateHtml("<p>본문</p>");
        serviceDraftWork = draftWork;
        when(draftService.getDraftTemplate(eq("TENANT_001"), eq(77L), eq("work"), eq("3001"), nullable(String.class))).thenReturn(draftWork);
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
