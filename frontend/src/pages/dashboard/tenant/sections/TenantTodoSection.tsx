import { Card, CardContent, Grid, Skeleton, Typography } from "@mui/material";
import { useMemo } from "react";
import type { TenantTodoSectionModel } from "../hooks/useTenantDashboardData";
import { TenantTodoCard } from "./TenantTodoCard";

type TenantTodoSectionProps = {
  isLoading: boolean;
  isError: boolean;
  sections: TenantTodoSectionModel[];
  pendingApproval?: boolean;
};

const GRID_SIZE = { xs: 12, sm: 6, md: 4, lg: 3, xl: 3 };

export function TenantTodoSection(props: TenantTodoSectionProps) {
  const { isLoading, isError, sections, pendingApproval = false } = props;

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
                            sx={{ borderTop: '3px solid', borderTopColor: 'primary.main', borderRadius: '4px' }}
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
        {isError ? "할일 목록을 불러오지 못했습니다." : "등록된 업무가 없습니다."}
      </Typography>
    );
  }

  return (
    <Grid container spacing={2}>
      {rows.map(({ sectionLabel, sectionKey, item }) => (
        <Grid key={`${sectionKey}-${item.routeId}`} size={GRID_SIZE}>
          <TenantTodoCard item={item} sectionLabel={sectionLabel} pendingApproval={pendingApproval} />
        </Grid>
      ))}
    </Grid>
  );
}
