package egovframework.let.documents.haccpbase.works.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

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
        when(dao.insertWork(anyMap())).thenReturn(1L);
        when(dao.selectWorkById(anyMap())).thenReturn(new egovframework.let.documents.haccpbase.works.domain.model.HaccpBaseWorkVO());

        HaccpBaseWorkSaveRequestVO payload = new HaccpBaseWorkSaveRequestVO();
        payload.setTenantCode("TENANT_001");
        payload.setCategoryGroupId(1L);
        payload.setDivisionCode("");
        payload.setDivisionName("위생점검");
        payload.setCycle("일");
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
        payload.setCycle("일");
        payload.setActive(true);
        payload.setReviewerId(1001L);
        payload.setApproverId(1002L);

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.createWork(payload, "3001")
        );

        assertEquals("이미 사용 중인 구분코드입니다.", ex.getMessage());
    }
}
