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
            // 기존 -> 최신 문서가 승인이면 무조건 미작성
            // 변경 -> 승인이어도 안내 시작일에 도달한 대상만 미작성, 도달 전은 작성 완료(confirmed)
            assertTrue(xml.contains("WHEN es.status_type = 'approved' AND es.notice_reached THEN NULL"),
                    "승인 문서는 안내 시작일에 도달했을 때만 미작성으로 센다");
            assertTrue(xml.contains("WHEN es.status_type = 'approved' THEN 'confirmed'"),
                    "안내 시작일 전 승인 문서는 작성 완료로 보고 어느 건수에도 넣지 않는다");
            assertFalse(xml.contains("WHEN es.status_type = 'approved' THEN NULL"),
                    "만료일과 상관없이 승인이면 미작성으로 세면 안 된다");
            assertFalse(xml.contains("DISTINCT ON (s.equipment_id, COALESCE(s.material_type, ''), s.certification_user_id)"),
                    "대상별 최신 문서 서브쿼리를 매퍼에 복사하지 않는다");
        }
    }

    @Test
    void dashboardMapper_should_count_only_final_confirm_pending_documents() throws Exception {
        ClassPathResource resource = new ClassPathResource(
                "egovframework/mapper/let/dashboard/DashboardMapper_SQL_postgresql.xml");

        try (InputStream inputStream = resource.getInputStream();
             Scanner scanner = new Scanner(inputStream, StandardCharsets.UTF_8.name())) {
            String xml = scanner.useDelimiter("\\A").hasNext() ? scanner.next() : "";
            assertTrue(xml.contains("<sql id=\"finalOwnerConfirmPending\">"), "최종확인 대기 fragment 가 없다");
            assertTrue(xml.contains("AND NOT (COALESCE(fo.app_status, '') = 'confirmed' AND fo.exe_at IS NOT NULL)"),
                    "확인 완료 문서는 대기가 아니다");
            assertTrue(xml.contains("WHEN COALESCE(em.status_type, '') = 'approved' AND NOT <include refid=\"finalOwnerConfirmPending\"><property name=\"doc\" value=\"em\"/></include> THEN 'confirmed'"),
                    "최종확인 대기가 아닌 승인은 승인 건수에서 뺀다");
            assertTrue(xml.contains("AND (COALESCE(em.status_type, '') != 'rejected' OR <include refid=\"finalOwnerConfirmPending\"><property name=\"doc\" value=\"em\"/></include>)"),
                    "최종확인 대기가 아닌 반려는 상신 문서로 보지 않아 미작성이 된다");
            assertTrue(xml.contains("WHEN es.status_type = 'rejected' AND NOT <include refid=\"finalOwnerConfirmPending\"><property name=\"doc\" value=\"es\"/></include> THEN NULL"),
                    "만료일 관리 대상의 최종확인된 반려는 미작성이다");
        }
    }
}
