package egovframework.let.documents.haccpbase.works.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
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

    @DisplayName("등록주기가 수시가 아니면 만료일 관리 양식은 N, 결재 적용 여부가 없으면 Y로 저장된다")
    @Test
    void createWork_forcesExpirationNWhenCycleIsNotAnytime() throws Exception {
        HaccpBaseWorkDAO dao = mock(HaccpBaseWorkDAO.class);
        HaccpBaseWorkSaveRequestVO payload = stubCreate(dao, "DAY");
        payload.setExpirationApply(true);

        new HaccpBaseWorkServiceImpl(dao, mock(EgovIdGnrService.class)).createWork(payload, "3001");

        Map<String, Object> params = captureInsertParams(dao);
        assertEquals("N", params.get("expirationApply"));
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

    @SuppressWarnings("unchecked")
    private Map<String, Object> captureInsertParams(HaccpBaseWorkDAO dao) throws Exception {
        ArgumentCaptor<Map<String, Object>> captor = ArgumentCaptor.forClass(Map.class);
        verify(dao).insertWork(captor.capture());
        return captor.getValue();
    }
}
