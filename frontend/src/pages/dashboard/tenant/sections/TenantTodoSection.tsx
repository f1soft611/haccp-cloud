import { Card, CardContent, Grid, Skeleton, Typography } from "@mui/material";
import { useMemo } from "react";
import type { TenantTodoSectionModel } from "../hooks/useTenantDashboardData";
import { TenantApprovalCard } from "./TenantApprovalCard";
import { TenantTodoCard } from "./TenantTodoCard";
import { APPROVAL_CARD_TOP_COLOR, DRAFT_CARD_TOP_COLOR, WORK_CARD_SX } from "../utils";

type TenantTodoSectionVariant = "draft" | "approval";

type TenantTodoSectionProps = {
  isLoading: boolean;
  isError: boolean;
  sections: TenantTodoSectionModel[];
  // 기존 -> pendingApproval?: boolean
  // 변경 -> 카드 종류, 상단 선 색, 안내 문구를 함께 고르는 variant
  variant?: TenantTodoSectionVariant;
};

const GRID_SIZE = { xs: 12, sm: 6, md: 4, lg: 3, xl: 3 };

const VARIANT_VIEW: Record<
  TenantTodoSectionVariant,
  { borderColor: string; emptyText: string; errorText: string }
> = {
  draft: {
  borderColor: DRAFT_CARD_TOP_COLOR,
    emptyText: "등록된 업무가 없습니다.",
    errorText: "할일 목록을 불러오지 못했습니다.",
  },
  approval: {
    borderColor: APPROVAL_CARD_TOP_COLOR,
    emptyText: "결재할 문서가 없습니다.",
    errorText: "결재할 문서를 불러오지 못했습니다.",
  },
};

// 나의 담당업무 카드 그리드: 로딩, 빈 상태, 오류 문구를 포함해 variant 별 카드를 표시
export function TenantTodoSection(props: TenantTodoSectionProps) {
  const { isLoading, isError, sections, variant = "draft" } = props;
  const view = VARIANT_VIEW[variant];

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

  if (isLoading) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3, 4].map((i) => (
          <Grid key={i} size={GRID_SIZE}>
            <Card
              variant="outlined"
              sx={{ ...WORK_CARD_SX, borderTop: `3px solid ${view.borderColor}` }}
            >
              <CardContent>
                <Skeleton variant="text" width="50%" />
                <Skeleton variant="text" width="30%" />
                <Skeleton variant="text" width="80%" height={28} />
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="rectangular" height={32} sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
        {isError ? view.errorText : view.emptyText}
      </Typography>
    );
  }

  return (
    <Grid container spacing={2}>
      {rows.map(({ sectionLabel, sectionKey, item }) => (
        <Grid key={`${sectionKey}-${item.routeId}`} size={GRID_SIZE}>
          {variant === "approval" ? (
            <TenantApprovalCard item={item} sectionLabel={sectionLabel} />
          ) : (
            <TenantTodoCard item={item} sectionLabel={sectionLabel} />
          )}
        </Grid>
      ))}
    </Grid>
  );
}