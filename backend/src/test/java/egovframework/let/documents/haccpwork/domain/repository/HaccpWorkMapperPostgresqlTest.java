package egovframework.let.documents.haccpwork.domain.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Scanner;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

class HaccpWorkMapperPostgresqlTest {

    private String readMapper() throws Exception {
        ClassPathResource resource = new ClassPathResource(
                "egovframework/mapper/let/documents/haccpwork/HaccpWorkMapper_SQL_postgresql.xml");
        try (InputStream inputStream = resource.getInputStream();
             Scanner scanner = new Scanner(inputStream, StandardCharsets.UTF_8.name())) {
            return scanner.useDelimiter("\\A").hasNext() ? scanner.next() : "";
        }
    }

    @Test
    void documentList_should_share_status_condition_with_pending_mine() throws Exception {
        String xml = readMapper();
        assertTrue(xml.contains("<sql id=\"documentStatusCondition\">"), "상태 조건 fragment 가 없다");
        assertTrue(xml.contains("statusType == 'pending_mine'"), "결재할문서 분기가 없다");
        assertEquals(2, xml.split("<include refid=\"documentStatusCondition\"/>", -1).length - 1,
                "목록과 건수 쿼리 모두 상태 조건 fragment 를 써야 한다");
    }

    @Test
    void unwrittenCycleList_should_generate_cycles_from_service_start_date() throws Exception {
        String xml = readMapper();
        assertTrue(xml.contains("id=\"HaccpWorkDAO.selectUnwrittenCycleList\""), "미작성 목록 쿼리가 없다");
        assertTrue(xml.contains("id=\"HaccpWorkDAO.selectUnwrittenCycleListCount\""), "미작성 건수 쿼리가 없다");
        assertTrue(xml.contains("COALESCE(t.service_start_date, DATE(t.created_at))"), "업무개시일 기준이 아니다");
        assertTrue(xml.contains("generate_series(cyc.first_start, cyc.cur_start, cyc.cycle_step)"), "주기 생성이 없다");
        assertTrue(xml.contains("TO_CHAR(gs.cycle_start, 'YYYY-MM-DD') AS cycle_date"), "cycle_date 형식이 다르다");
    }

    @Test
    void unwrittenList_should_list_expiration_targets_by_latest_approved_document() throws Exception {
        String xml = readMapper();
        assertTrue(xml.contains("<sql id=\"unwrittenWorkWhere\">"), "미작성 공통 조건 fragment 가 없다");
        assertTrue(xml.contains("<sql id=\"unwrittenExpirationFrom\">"), "만료일 관리 대상 FROM fragment 가 없다");
        assertTrue(xml.contains("AND COALESCE(w.expiration_apply, 'N') != 'Y'"),
                "주기 기반 미작성은 만료일 관리 업무를 제외해야 한다");
        assertTrue(xml.contains("JOIN v_expiration_target_latest es"),
                "만료일 관리 대상별 최신 문서는 뷰에서 읽는다");
        assertFalse(xml.contains("DISTINCT ON (s.equipment_id, COALESCE(s.material_type, ''), s.certification_user_id)"),
                "대상별 최신 문서 서브쿼리를 매퍼에 복사하지 않는다");
        // 변경 -> 최종확인된 반려도 미작성이라 OR 조건
        assertTrue(xml.contains("es.status_type = 'approved'"), "대상의 최신 문서가 승인이면 미작성이다");
        assertEquals(2, xml.split("<include refid=\"unwrittenExpirationFrom\"/>", -1).length - 1,
                "목록과 건수 쿼리 모두 만료일 관리 대상 분기를 써야 한다");
    }

    @Test
    void unwrittenList_should_include_cycles_with_only_final_confirmed_rejections() throws Exception {
        String xml = readMapper();
        assertTrue(xml.contains("<sql id=\"finalOwnerConfirmPending\">"), "최종확인 대기 fragment 가 없다");
        assertTrue(xml.contains("AND NOT (COALESCE(fo.app_status, '') = 'confirmed' AND fo.exe_at IS NOT NULL)"),
                "확인 완료 문서는 대기가 아니다");
        assertTrue(xml.contains("AND (COALESCE(em.status_type, '') != 'rejected' OR <include refid=\"finalOwnerConfirmPending\"><property name=\"doc\" value=\"em\"/></include>)"),
                "주기 행은 대시보드 cs 와 같은 조건이어야 한다");
        assertTrue(xml.contains("AND (es.status_type = 'approved' OR (es.status_type = 'rejected' AND NOT <include refid=\"finalOwnerConfirmPending\"><property name=\"doc\" value=\"es\"/></include>))"),
                "만료일 관리 대상의 최종확인된 반려도 미작성 목록에 나와야 한다");
    }
}