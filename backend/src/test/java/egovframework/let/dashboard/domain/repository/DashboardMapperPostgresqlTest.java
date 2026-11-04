package egovframework.let.dashboard.domain.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Scanner;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

class DashboardMapperPostgresqlTest {

    @Test
    void dashboardMapper_should_build_owner_from_authority_table() throws Exception {
        ClassPathResource resource = new ClassPathResource(
                "egovframework/mapper/let/dashboard/DashboardMapper_SQL_postgresql.xml");
        assertTrue(resource.exists(), "Expected PostgreSQL dashboard mapper to exist");

        try (InputStream inputStream = resource.getInputStream();
             Scanner scanner = new Scanner(inputStream, StandardCharsets.UTF_8.name())) {
            String xml = scanner.useDelimiter("\\A").hasNext() ? scanner.next() : "";
            assertFalse(xml.contains("CONCAT('검토:'"), "owner must not be reviewer/approver names");
            assertEquals(2, xml.split("\\) wa ON TRUE", -1).length - 1,
                    "assignee LATERAL join must exist in both todo and approval alert queries");
            assertTrue(xml.contains("first_assignee_name"), "first_assignee_name is missing");
            assertTrue(xml.contains("assignee_count"), "assignee_count is missing");
        }
    }

    @Test
    void dashboardMapper_should_count_unwritten_from_service_start_date_and_treat_pre_apply_as_unwritten() throws Exception {
        ClassPathResource resource = new ClassPathResource(
                "egovframework/mapper/let/dashboard/DashboardMapper_SQL_postgresql.xml");

        try (InputStream inputStream = resource.getInputStream();
             Scanner scanner = new Scanner(inputStream, StandardCharsets.UTF_8.name())) {
            String xml = scanner.useDelimiter("\\A").hasNext() ? scanner.next() : "";
            assertTrue(xml.contains("COALESCE(t.service_start_date, DATE(t.created_at))"),
                    "미작성 주기 시작은 업무개시일 기준이어야 한다");
            assertFalse(xml.contains("GREATEST(t.created_at, w.created_at)"),
                    "업무 등록일 하한은 쓰지 않는다");
            assertTrue(xml.contains("AND COALESCE(em.status_type, '') != 'pre_apply'"),
                    "임시저장만 있는 주기는 미작성으로 센다");
        }
    }

    @Test
    void dashboardMapper_should_count_unwritten_by_workdate_and_week_tables() throws Exception {
        ClassPathResource resource = new ClassPathResource(
                "egovframework/mapper/let/dashboard/DashboardMapper_SQL_postgresql.xml");

        try (InputStream inputStream = resource.getInputStream();
             Scanner scanner = new Scanner(inputStream, StandardCharsets.UTF_8.name())) {
            String xml = scanner.useDelimiter("\\A").hasNext() ? scanner.next() : "";
            assertTrue(xml.contains("FROM tb_workdate wd"),
                    "일 주기 미작성은 tb_workdate 근무일 기준이어야 한다");
            assertTrue(xml.contains("wd.work_type IN ('WORK', 'SPECIAL_WORK')"),
                    "근무일, 특근일만 주기로 센다");
            assertTrue(xml.contains("FROM tb_week wk"),
                    "주 주기 미작성은 tb_week 기준이어야 한다");
            assertTrue(xml.contains("WHERE cyc.cycle_unit NOT IN ('day', 'week')"),
                    "월 이상 주기만 generate_series 를 쓴다");
        }
    }

    @Test
    void dashboardMapper_should_start_calendar_from_service_start_date() throws Exception {
        ClassPathResource resource = new ClassPathResource(
                "egovframework/mapper/let/dashboard/DashboardMapper_SQL_postgresql.xml");

        try (InputStream inputStream = resource.getInputStream();
             Scanner scanner = new Scanner(inputStream, StandardCharsets.UTF_8.name())) {
            String xml = scanner.useDelimiter("\\A").hasNext() ? scanner.next() : "";
            assertTrue(xml.contains("SELECT TO_CHAR(COALESCE(t.service_start_date, DATE(t.created_at)), 'YYYYMMDD')"),
                    "캘린더 표시 시작일은 미작성 건수와 같은 서비스 시작일 기준이어야 한다");
            assertFalse(xml.contains("join_date"),
                    "캘린더 표시 시작일은 입사일을 보지 않는다");
        }
    }

    @Test
    void dashboardMapper_should_count_cycles_by_latest_status_from_service_start_date() throws Exception {
        ClassPathResource resource = new ClassPathResource(
                "egovframework/mapper/let/dashboard/DashboardMapper_SQL_postgresql.xml");

        try (InputStream inputStream = resource.getInputStream();
             Scanner scanner = new Scanner(inputStream, StandardCharsets.UTF_8.name())) {
            String xml = scanner.useDelimiter("\\A").hasNext() ? scanner.next() : "";
            assertTrue(xml.contains("COUNT(*) FILTER (WHERE ls.status_type IS NULL)::int AS unwritten_count"),
                    "최신 문서가 없는 주기를 미작성으로 센다");
            assertTrue(xml.contains("COUNT(*) FILTER (WHERE ls.status_type = 'in_progress')::int AS in_progress_cycle_count"),
                    "결재진행중 주기 수가 있어야 한다");
            assertTrue(xml.contains("COUNT(*) FILTER (WHERE ls.status_type = 'approved')::int AS approved_cycle_count"),
                    "승인 주기 수가 있어야 한다");
            assertTrue(xml.contains("COUNT(*) FILTER (WHERE ls.status_type = 'rejected')::int AS rejected_cycle_count"),
                    "반려 주기 수가 있어야 한다");
            assertTrue(xml.contains("<result property=\"approvedCycleCount\" column=\"approved_cycle_count\"/>"),
                    "resultMap 에 승인 주기 수 매핑이 있어야 한다");
        }
    }

    @Test
    void dashboardMapper_should_count_expiration_targets_by_latest_status() throws Exception {
        ClassPathResource resource = new ClassPathResource(
                "egovframework/mapper/let/dashboard/DashboardMapper_SQL_postgresql.xml");

        try (InputStream inputStream = resource.getInputStream();
             Scanner scanner = new Scanner(inputStream, StandardCharsets.UTF_8.name())) {
            String xml = scanner.useDelimiter("\\A").hasNext() ? scanner.next() : "";
            assertTrue(xml.contains("WHERE NOT cyc.is_anytime AND COALESCE(w.expiration_apply, 'N') != 'Y'"),
                    "주기 기반 집계는 만료일 관리 업무를 제외해야 한다");
            assertTrue(xml.contains("FROM v_expiration_target_latest es"),
                    "만료일 관리 대상별 최신 문서는 뷰에서 읽는다");
            assertTrue(xml.contains("AND es.drafting_work_category_id = w.drafting_work_category_id"),
                    "뷰는 업무 단위로 걸러야 한다");
            assertTrue(xml.contains("CASE WHEN es.status_type = 'approved' THEN NULL ELSE es.status_type END"),
                    "대상의 최신 문서가 승인이면 미작성으로 센다");
            assertFalse(xml.contains("DISTINCT ON (s.equipment_id, COALESCE(s.material_type, ''), s.certification_user_id)"),
                    "대상별 최신 문서 서브쿼리를 매퍼에 복사하지 않는다");
        }
    }
}
