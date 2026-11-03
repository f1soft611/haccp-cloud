package egovframework.let.documents.haccpwork.domain.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
}