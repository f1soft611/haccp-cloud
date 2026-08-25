package egovframework.let.documents.haccpbase.categories.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.egovframe.rte.fdl.idgnr.EgovIdGnrService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import egovframework.let.documents.haccpbase.categories.domain.model.HaccpBaseCategorySaveRequestVO;
import egovframework.let.documents.haccpbase.categories.domain.repository.HaccpBaseCategoryDAO;

class HaccpBaseCategoryServiceImplTest {

    @DisplayName("분류코드가 비어 있으면 IDS 테이블 기반 코드가 자동 생성된다")
    @Test
    void createCategory_generatesCodeFromCommonIdTableWhenBlank() throws Exception {
        HaccpBaseCategoryDAO dao = mock(HaccpBaseCategoryDAO.class);
        EgovIdGnrService idGnrService = mock(EgovIdGnrService.class);
        HaccpBaseCategoryServiceImpl service = new HaccpBaseCategoryServiceImpl(dao, idGnrService);

        when(dao.selectTenantIdByCode("TENANT_001")).thenReturn(10L);
        when(dao.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(3001L);
        when(dao.selectCategoryIdByCode(eq(10L), eq("001"))).thenReturn(null);
        when(idGnrService.getNextStringId()).thenReturn("001");
        when(dao.insertCategory(anyMap())).thenReturn(1L);
        when(dao.selectCategoryById(anyMap())).thenReturn(new egovframework.let.documents.haccpbase.categories.domain.model.HaccpBaseCategoryVO());

        HaccpBaseCategorySaveRequestVO payload = new HaccpBaseCategorySaveRequestVO();
        payload.setTenantCode("TENANT_001");
        payload.setCategoryCode("");
        payload.setCategoryName("위생관리");
        payload.setSortOrder(1);
        payload.setActive(true);

        service.createCategory(payload, "3001");

        assertEquals("001", payload.getCategoryCode());
    }

    @DisplayName("같은 분류 코드는 중복 등록할 수 없다")
    @Test
    void createCategory_throwsWhenDuplicateCodeExists() throws Exception {
        HaccpBaseCategoryDAO dao = mock(HaccpBaseCategoryDAO.class);
        EgovIdGnrService idGnrService = mock(EgovIdGnrService.class);
        HaccpBaseCategoryServiceImpl service = new HaccpBaseCategoryServiceImpl(dao, idGnrService);

        when(dao.selectTenantIdByCode("TENANT_001")).thenReturn(10L);
        when(dao.selectCategoryIdByCode(eq(10L), eq("001"))).thenReturn(99L);

        HaccpBaseCategorySaveRequestVO payload = new HaccpBaseCategorySaveRequestVO();
        payload.setTenantCode("TENANT_001");
        payload.setCategoryCode("001");
        payload.setCategoryName("위생관리");
        payload.setSortOrder(1);
        payload.setActive(true);

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.createCategory(payload, "3001")
        );

        assertEquals("이미 사용 중인 분류코드입니다.", ex.getMessage());
    }
}
