import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import {
  Button,
  Chip,
  IconButton,
  Skeleton,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AdminGrid } from "../../../../shared/components/data/AdminGrid";
import { APP_LABELS } from "../../../../shared/constants/labels";
import { resolveApprovalStatusView } from "../../../../shared/utils/approvalStatus";
import type { TenantTodoSectionModel } from "../hooks/useTenantDashboardData";
import { getWorkCycleLabel, getWorkCycleSx } from "../utils";
import { resolveDraftRoute } from "../../../../shared/utils/workDraftRoute";

type TenantTodoSectionProps = {
  isLoading: boolean;
  isError: boolean;
  sections: TenantTodoSectionModel[];
};

const COLUMN_COUNT = 7;

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentMonthDateRange(today: Date = new Date()): {
  startDate: string;
  endDate: string;
} {
  return {
    startDate: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    endDate: formatDate(today),
  };
}

// 기존 -> 업무분류별 카드 안에 업무를 박스로 나열
// 변경 -> 업무 1건 = 1행인 그리드(AdminGrid)로 표시, 분류는 행마다 반복, 최대 높이 내 스크롤
export function TenantTodoSection(props: TenantTodoSectionProps) {
  const { isLoading, isError, sections } = props;
  const navigate = useNavigate();

  const rows = useMemo(
    () =>
      sections.flatMap((section) =>
        section.items.map((item) => ({
          sectionLabel: section.label,
          sectionKey: section.key,
          item,
        })),
      ),
    [sections],
  );

  // 기존 -> Paper 카드 + 제목/설명 헤더 안에 그리드 표시
  // 변경 -> 껍데기 없이 그리드만 표시
  return (
    <AdminGrid ariaLabel={APP_LABELS.dashboard.blocks.todos} maxHeight={560}>
      <TableHead>
        <TableRow>
          <TableCell align="center" width={160}>
            업무분류
          </TableCell>
          <TableCell align="center" sx={{ minWidth: 200 }}>
            업무명
          </TableCell>
          <TableCell align="center" width={90}>
            주기
          </TableCell>
          <TableCell align="center" width={110}>
            상태
          </TableCell>
          <TableCell align="center" width={110}>
            담당자
          </TableCell>
          <TableCell align="center" width={150}>
            최근일시
          </TableCell>
          <TableCell align="center" width={140}>
            작업
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {isLoading ? (
          [1, 2, 3].map((skeletonId) => (
            <TableRow key={`todo-skeleton-${skeletonId}`}>
              {Array.from({ length: COLUMN_COUNT }, (_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <Skeleton variant="text" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={COLUMN_COUNT} align="center">
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                {isError
                  ? "할일 목록을 불러오지 못했습니다."
                  : "등록된 업무가 없습니다."}
              </Typography>
            </TableCell>
          </TableRow>
        ) : (
          rows.map(({ sectionLabel, sectionKey, item }) => {
            const cycleLabel = getWorkCycleLabel(item);
            const { label: statusLabel, color: statusColor } =
              resolveApprovalStatusView({
                approvalStatusType: item.approvalStatusType,
                approvalStatusTypeName: item.approvalStatusTypeName,
                todoStatus: item.status,
                writtenInCycle: item.writtenInCycle,
              });

            return (
              <TableRow key={`${sectionKey}-${item.id}`} hover>
                <TableCell align="center">{sectionLabel}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {item.divisionName || item.title || "-"}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    size="small"
                    label={cycleLabel}
                    sx={{
                      height: 22,
                      fontWeight: 700,
                      ...getWorkCycleSx(cycleLabel),
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    size="small"
                    label={statusLabel}
                    color={statusColor}
                    sx={{ height: 20, fontWeight: 700 }}
                  />
                </TableCell>
                <TableCell align="center">{item.updatedBy}</TableCell>
                <TableCell align="center">{item.updatedAt || "-"}</TableCell>
                <TableCell align="center">
                  <Stack
                    direction="row"
                    spacing={0.6}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Tooltip title="작성하러 가기">
                      <IconButton
                        size="small"
                        color="primary"
                        aria-label="작성하러 가기"
                        onClick={() => {
                          const path = resolveDraftRoute(item);
                          if (!path) {
                            return;
                          }
                          navigate(path);
                        }}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Button
                      size="small"
                      variant="outlined"
                      endIcon={<ArrowForwardRoundedIcon />}
                      onClick={() => {
                        const range = getCurrentMonthDateRange();
                        const query = new URLSearchParams({
                          workType: sectionLabel,
                          startDate: range.startDate,
                          endDate: range.endDate,
                        });
                        navigate(`/docs/haccp-doc?${query.toString()}`);
                      }}
                    >
                      이동
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </AdminGrid>
  );
}
