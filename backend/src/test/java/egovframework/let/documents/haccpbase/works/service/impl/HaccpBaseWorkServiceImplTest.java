package egovframework.let.documents.haccpbase.works.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;

import java.util.Map;

import org.mockito.ArgumentCaptor;
import org.egovframe.rte.fdl.idgnr.EgovIdGnrService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import egovframework.let.documents.haccpbase.works.domain.model.HaccpBaseWorkSaveRequestVO;
import egovframework.let.documents.haccpbase.works.domain.model.HaccpBaseWorkSearchConditionVO;
import egovframework.let.documents.haccpbase.works.domain.repository.HaccpBaseWorkDAO;

class HaccpBaseWorkServiceImplTest {

    @DisplayName("업무코드가 비어 있으면 IDS 테이블 기반 코드가 자동 생성된다")
    @Test
    void createWork_generatesCodeFromCommonIdTableWhenBlank() throws Exception {
        HaccpBaseWorkDAO dao = mock(HaccpBaseWorkDAO.class);
        EgovIdGnrService idGnrService = mock(EgovIdGnrService.class);
        HaccpBaseWorkServiceImpl service = new HaccpBaseWorkServiceImpl(dao, idGnrService);

        when(dao.selectTenantIdByCode("TENANT_001")).thenReturn(10L);
        when(dao.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(3001L);
        when(dao.selectWorkIdByCode(eq(10L), eq(1L), eq("001"))).thenReturn(null);
        when(idGnrService.getNextStringId()).thenReturn("001");
        when(dao.countWorkCycleCode(10L, "DAY")).thenReturn(1);
        when(dao.insertWork(anyMap())).thenReturn(1L);
        when(dao.selectWorkById(anyMap())).thenReturn(new egovframework.let.documents.haccpbase.works.domain.model.HaccpBaseWorkVO());

        HaccpBaseWorkSaveRequestVO payload = new HaccpBaseWorkSaveRequestVO();
        payload.setTenantCode("TENANT_001");
        payload.setCategoryGroupId(1L);
        payload.setDivisionCode("");
        payload.setDivisionName("위생점검");
        payload.setCycle("DAY");
        payload.setActive(true);
        payload.setReviewerId(1001L);
        payload.setApproverId(1002L);

        service.createWork(payload, "3001");

        assertEquals("001", payload.getDivisionCode());
    }

    @DisplayName("같은 업무 구분코드는 중복 등록할 수 없다")
    @Test
    void createWork_throwsWhenDuplicateCodeExists() throws Exception {
        HaccpBaseWorkDAO dao = mock(HaccpBaseWorkDAO.class);
        EgovIdGnrService idGnrService = mock(EgovIdGnrService.class);
        HaccpBaseWorkServiceImpl service = new HaccpBaseWorkServiceImpl(dao, idGnrService);

        when(dao.selectTenantIdByCode("TENANT_001")).thenReturn(10L);
        when(dao.selectWorkIdByCode(eq(10L), eq(1L), eq("001"))).thenReturn(77L);

        HaccpBaseWorkSaveRequestVO payload = new HaccpBaseWorkSaveRequestVO();
        payload.setTenantCode("TENANT_001");
        payload.setCategoryGroupId(1L);
        payload.setDivisionCode("001");
        payload.setDivisionName("위생점검");
        payload.setCycle("DAY");
        payload.setActive(true);
        payload.setReviewerId(1001L);
        payload.setApproverId(1002L);

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.createWork(payload, "3001")
        );

        assertEquals("이미 사용 중인 구분코드입니다.", ex.getMessage());
    }

    @DisplayName("공통코드 WF_FORM_CYCLE에 없는 등록주기는 저장할 수 없다")
    @Test
    void createWork_throwsWhenCycleCodeIsNotRegistered() throws Exception {
        HaccpBaseWorkDAO dao = mock(HaccpBaseWorkDAO.class);
        EgovIdGnrService idGnrService = mock(EgovIdGnrService.class);
        HaccpBaseWorkServiceImpl service = new HaccpBaseWorkServiceImpl(dao, idGnrService);

        when(dao.selectTenantIdByCode("TENANT_001")).thenReturn(10L);
        when(dao.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(3001L);
        when(dao.selectWorkIdByCode(eq(10L), eq(1L), eq("001"))).thenReturn(null);
        when(dao.countWorkCycleCode(10L, "FOO")).thenReturn(0);

        HaccpBaseWorkSaveRequestVO payload = new HaccpBaseWorkSaveRequestVO();
        payload.setTenantCode("TENANT_001");
        payload.setCategoryGroupId(1L);
        payload.setDivisionCode("001");
        payload.setDivisionName("위생점검");
        payload.setCycle("FOO");
        payload.setActive(true);
        payload.setReviewerId(1001L);
        payload.setApproverId(1002L);

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.createWork(payload, "3001")
        );

        assertEquals("등록주기가 올바르지 않습니다.", ex.getMessage());
    }

    // 기존 -> 수시가 아니면 만료일 관리 양식 강제 N / 변경 -> 등록주기와 상관없이 요청 값 저장
    @DisplayName("등록주기가 수시가 아니어도 만료일 관리 양식 Y가 저장되고, 결재 적용 여부가 없으면 Y로 저장된다")
    @Test
    void createWork_keepsExpirationYWhenCycleIsNotAnytime() throws Exception {
        HaccpBaseWorkDAO dao = mock(HaccpBaseWorkDAO.class);
        HaccpBaseWorkSaveRequestVO payload = stubCreate(dao, "DAY");
        payload.setExpirationApply(true);

        new HaccpBaseWorkServiceImpl(dao, mock(EgovIdGnrService.class)).createWork(payload, "3001");

        Map<String, Object> params = captureInsertParams(dao);
        assertEquals("Y", params.get("expirationApply"));
        assertEquals("Y", params.get("approvalApply"));
    }

    @DisplayName("등록주기가 수시이면 만료일 관리 양식 Y, 결재 미적용 N이 그대로 저장된다")
    @Test
    void createWork_keepsExpirationYWhenCycleIsAnytime() throws Exception {
        HaccpBaseWorkDAO dao = mock(HaccpBaseWorkDAO.class);
        HaccpBaseWorkSaveRequestVO payload = stubCreate(dao, "ANYTIME");
        payload.setExpirationApply(true);
        payload.setApprovalApply(false);

        new HaccpBaseWorkServiceImpl(dao, mock(EgovIdGnrService.class)).createWork(payload, "3001");

        Map<String, Object> params = captureInsertParams(dao);
        assertEquals("Y", params.get("expirationApply"));
        assertEquals("N", params.get("approvalApply"));
    }

    @DisplayName("결재 미적용이면 검토자/승인자를 보내도 null로 저장된다")
    @Test
    void createWork_clearsSignersWhenApprovalNotApplied() throws Exception {
        HaccpBaseWorkDAO dao = mock(HaccpBaseWorkDAO.class);
        HaccpBaseWorkSaveRequestVO payload = stubCreate(dao, "DAY");
        payload.setApprovalApply(false);

        new HaccpBaseWorkServiceImpl(dao, mock(EgovIdGnrService.class)).createWork(payload, "3001");

        Map<String, Object> params = captureInsertParams(dao);
        assertEquals("N", params.get("approvalApply"));
        assertNull(params.get("reviewerId"));
        assertNull(params.get("approverId"));
    }

    @DisplayName("결재 적용이면 검토자/승인자가 그대로 저장된다")
    @Test
    void createWork_keepsSignersWhenApprovalApplied() throws Exception {
        HaccpBaseWorkDAO dao = mock(HaccpBaseWorkDAO.class);
        HaccpBaseWorkSaveRequestVO payload = stubCreate(dao, "DAY");
        payload.setApprovalApply(true);

        new HaccpBaseWorkServiceImpl(dao, mock(EgovIdGnrService.class)).createWork(payload, "3001");

        Map<String, Object> params = captureInsertParams(dao);
        assertEquals(1001L, params.get("reviewerId"));
        assertEquals(1002L, params.get("approverId"));
    }

    @DisplayName("만료일 관리 양식이면 만료일 안내 기준과 계산숫자가 그대로 저장된다")
    @Test
    void createWork_savesExpirationNoticeWhenExpirationApply() throws Exception {
        HaccpBaseWorkDAO dao = mock(HaccpBaseWorkDAO.class);
        HaccpBaseWorkSaveRequestVO payload = stubCreate(dao, "ANYTIME");
        payload.setExpirationApply(true);
        payload.setExpirationNoticeStatus("DAY");
        payload.setExpirationNoticeCount(30);

        new HaccpBaseWorkServiceImpl(dao, mock(EgovIdGnrService.class)).createWork(payload, "3001");

        Map<String, Object> params = captureInsertParams(dao);
        assertEquals("DAY", params.get("expirationNoticeStatus"));
        assertEquals(30, params.get("expirationNoticeCount"));
    }

    @DisplayName("만료일 관리 양식이 아니면 안내 값을 보내도 NONE, null 로 저장된다")
    @Test
    void createWork_clearsExpirationNoticeWhenNotExpirationApply() throws Exception {
        HaccpBaseWorkDAO dao = mock(HaccpBaseWorkDAO.class);
        HaccpBaseWorkSaveRequestVO payload = stubCreate(dao, "ANYTIME");
        payload.setExpirationApply(false);
        payload.setExpirationNoticeStatus("DAY");
        payload.setExpirationNoticeCount(30);

        new HaccpBaseWorkServiceImpl(dao, mock(EgovIdGnrService.class)).createWork(payload, "3001");

        Map<String, Object> params = captureInsertParams(dao);
        assertEquals("NONE", params.get("expirationNoticeStatus"));
        assertNull(params.get("expirationNoticeCount"));
    }

    @DisplayName("안내 기준이 없음이면 계산숫자를 보내도 null 로 저장된다")
    @Test
    void createWork_dropsNoticeCountWhenStatusNone() throws Exception {
        HaccpBaseWorkDAO dao = mock(HaccpBaseWorkDAO.class);
        HaccpBaseWorkSaveRequestVO payload = stubCreate(dao, "ANYTIME");
        payload.setExpirationApply(true);
        payload.setExpirationNoticeStatus("NONE");
        payload.setExpirationNoticeCount(5);

        new HaccpBaseWorkServiceImpl(dao, mock(EgovIdGnrService.class)).createWork(payload, "3001");

        Map<String, Object> params = captureInsertParams(dao);
        assertEquals("NONE", params.get("expirationNoticeStatus"));
        assertNull(params.get("expirationNoticeCount"));
    }

    @DisplayName("안내 값 없이 보낸 요청은 NONE, null 로 저장된다")
    @Test
    void createWork_defaultsExpirationNoticeToNone() throws Exception {
        HaccpBaseWorkDAO dao = mock(HaccpBaseWorkDAO.class);
        HaccpBaseWorkSaveRequestVO payload = stubCreate(dao, "ANYTIME");
        payload.setExpirationApply(true);

        new HaccpBaseWorkServiceImpl(dao, mock(EgovIdGnrService.class)).createWork(payload, "3001");

        Map<String, Object> params = captureInsertParams(dao);
        assertEquals("NONE", params.get("expirationNoticeStatus"));
        assertNull(params.get("expirationNoticeCount"));
    }

    @DisplayName("허용되지 않은 안내 기준이면 오류가 난다")
    @Test
    void createWork_throwsWhenNoticeStatusInvalid() throws Exception {
        HaccpBaseWorkDAO dao = mock(HaccpBaseWorkDAO.class);
        HaccpBaseWorkSaveRequestVO payload = stubCreate(dao, "ANYTIME");
        payload.setExpirationApply(true);
        payload.setExpirationNoticeStatus("WEEK");
        payload.setExpirationNoticeCount(1);

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> new HaccpBaseWorkServiceImpl(dao, mock(EgovIdGnrService.class)).createWork(payload, "3001")
        );

        assertEquals("만료일 안내 기준이 올바르지 않습니다.", ex.getMessage());
    }

    @DisplayName("안내 기준이 일/개월/년인데 계산숫자가 없거나 1 미만이면 오류가 난다")
    @Test
    void createWork_throwsWhenNoticeCountMissingOrZero() throws Exception {
        for (Integer count : new Integer[] {null, 0}) {
            HaccpBaseWorkDAO dao = mock(HaccpBaseWorkDAO.class);
            HaccpBaseWorkSaveRequestVO payload = stubCreate(dao, "ANYTIME");
            payload.setExpirationApply(true);
            payload.setExpirationNoticeStatus("MONTH");
            payload.setExpirationNoticeCount(count);

            IllegalArgumentException ex = assertThrows(
                    IllegalArgumentException.class,
                    () -> new HaccpBaseWorkServiceImpl(dao, mock(EgovIdGnrService.class)).createWork(payload, "3001")
            );

            assertEquals("만료일 안내 계산숫자는 1 이상이어야 합니다.", ex.getMessage());
        }
    }

    private HaccpBaseWorkSaveRequestVO stubCreate(HaccpBaseWorkDAO dao, String cycle) throws Exception {
        when(dao.selectTenantIdByCode("TENANT_001")).thenReturn(10L);
        when(dao.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(3001L);
        when(dao.selectWorkIdByCode(eq(10L), eq(1L), eq("001"))).thenReturn(null);
        when(dao.countWorkCycleCode(10L, cycle)).thenReturn(1);
        when(dao.insertWork(anyMap())).thenReturn(1L);
        when(dao.selectWorkById(anyMap())).thenReturn(new egovframework.let.documents.haccpbase.works.domain.model.HaccpBaseWorkVO());

        HaccpBaseWorkSaveRequestVO payload = new HaccpBaseWorkSaveRequestVO();
        payload.setTenantCode("TENANT_001");
        payload.setCategoryGroupId(1L);
        payload.setDivisionCode("001");
        payload.setDivisionName("위생점검");
        payload.setCycle(cycle);
        payload.setActive(true);
        payload.setReviewerId(1001L);
        payload.setApproverId(1002L);
        return payload;
    }

    @DisplayName("업무 목록 조회 시 분류 ID와 공백 제거한 키워드를 조회조건으로 전달한다")
    @Test
    void listWorks_passesCategoryAndTrimmedKeyword() throws Exception {
        HaccpBaseWorkDAO dao = mock(HaccpBaseWorkDAO.class);
        EgovIdGnrService idGnrService = mock(EgovIdGnrService.class);
        HaccpBaseWorkServiceImpl service = new HaccpBaseWorkServiceImpl(dao, idGnrService);
        when(dao.selectTenantIdByCode("TENANT_001")).thenReturn(10L);

        service.listWorks("tenant_001", "y", 11L, "  금도연 ");

        ArgumentCaptor<HaccpBaseWorkSearchConditionVO> captor =
                ArgumentCaptor.forClass(HaccpBaseWorkSearchConditionVO.class);
        verify(dao).selectWorkList(captor.capture());
        HaccpBaseWorkSearchConditionVO condition = captor.getValue();
        assertEquals(10L, condition.getTenantId());
        assertEquals("Y", condition.getActive());
        assertEquals(11L, condition.getCategoryId());
        assertEquals("금도연", condition.getKeyword());
    }

    @DisplayName("업무 목록 조회 시 빈 키워드와 분류 미지정은 조건을 걸지 않는다")
    @Test
    void listWorks_ignoresBlankKeywordAndNullCategory() throws Exception {
        HaccpBaseWorkDAO dao = mock(HaccpBaseWorkDAO.class);
        EgovIdGnrService idGnrService = mock(EgovIdGnrService.class);
        HaccpBaseWorkServiceImpl service = new HaccpBaseWorkServiceImpl(dao, idGnrService);
        when(dao.selectTenantIdByCode("TENANT_001")).thenReturn(10L);

        service.listWorks("TENANT_001", null, null, "   ");

        ArgumentCaptor<HaccpBaseWorkSearchConditionVO> captor =
                ArgumentCaptor.forClass(HaccpBaseWorkSearchConditionVO.class);
        verify(dao).selectWorkList(captor.capture());
        HaccpBaseWorkSearchConditionVO condition = captor.getValue();
        assertNull(condition.getActive());
        assertNull(condition.getCategoryId());
        assertNull(condition.getKeyword());
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> captureInsertParams(HaccpBaseWorkDAO dao) throws Exception {
        ArgumentCaptor<Map<String, Object>> captor = ArgumentCaptor.forClass(Map.class);
        verify(dao).insertWork(captor.capture());
        return captor.getValue();
    }
}
