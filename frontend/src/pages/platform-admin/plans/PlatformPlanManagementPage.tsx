import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { APP_LABELS } from '../../../shared/constants/labels';
import { useFeedback } from '../../../shared/hooks/useFeedback';
import {
  getPlanFeatures,
  getPlanMenuCodes,
  listPlanSummaries,
  savePlanMenuCodes,
} from '../../../services/plan/planAccessService';
import { listPlatformMenus } from '../../../services/platform/platformMenuService';

export function PlatformPlanManagementPage() {
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useFeedback();
  const [selectedPlanCode, setSelectedPlanCode] = useState('');
  const [draftMenuCodes, setDraftMenuCodes] = useState<string[] | null>(null);

  const plansQuery = useQuery({
    queryKey: ['platform-admin', 'plan-summaries'],
    queryFn: listPlanSummaries,
    retry: false,
  });

  const menusQuery = useQuery({
    queryKey: ['platform-admin', 'menus'],
    queryFn: listPlatformMenus,
    retry: false,
  });

  const effectivePlanCode =
    selectedPlanCode || plansQuery.data?.[0]?.planCode || '';

  const planFeaturesQuery = useQuery({
    queryKey: ['platform-admin', 'plan-features', effectivePlanCode],
    queryFn: () => getPlanFeatures(effectivePlanCode),
    enabled: effectivePlanCode.length > 0,
    retry: false,
  });

  const planMenusQuery = useQuery({
    queryKey: ['platform-admin', 'plan-menus', effectivePlanCode],
    queryFn: () => getPlanMenuCodes(effectivePlanCode),
    enabled: effectivePlanCode.length > 0,
    retry: false,
  });

  const selectedMenuCodes = draftMenuCodes ?? planMenusQuery.data ?? [];

  const saveMutation = useMutation({
    mutationFn: savePlanMenuCodes,
    onSuccess: async (_, payload) => {
      setDraftMenuCodes(null);
      showSuccess('플랜 메뉴 매핑이 저장되었습니다.');
      await queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'plan-menus', payload.planCode],
      });
      await queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'plan-summaries'],
      });
    },
    onError: () => {
      showError('플랜 메뉴 매핑 저장에 실패했습니다.');
    },
  });

  const featureEntries = useMemo(
    () => Object.entries(planFeaturesQuery.data ?? {}),
    [planFeaturesQuery.data],
  );

  const toggleMenuCode = (menuCode: string) => {
    setDraftMenuCodes((prev) => {
      const base = prev ?? planMenusQuery.data ?? [];
      return base.includes(menuCode)
        ? base.filter((item) => item !== menuCode)
        : [...base, menuCode];
    });
  };

  const handleSave = () => {
    if (!effectivePlanCode) {
      return;
    }

    saveMutation.mutate({
      planCode: effectivePlanCode,
      menuCodes: selectedMenuCodes,
    });
  };

  return (
    <Stack spacing={2} data-testid="platform-plan-management-page">
      <PageHeader
        groupLabel={APP_LABELS.menu.platformGroup}
        title={APP_LABELS.pageTitle.platformPlanManagement}
        description="플랜별 메뉴 매핑과 기능 활성 상태를 조회하고 운영합니다."
      />

      {plansQuery.isError ? (
        <Alert severity="warning">플랜 목록을 불러오지 못했습니다.</Alert>
      ) : null}

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
        <Paper sx={{ p: 2, minWidth: { lg: 320 }, flex: { lg: '0 0 320px' } }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
            플랜 목록
          </Typography>

          <Stack spacing={1}>
            {(plansQuery.data ?? []).map((plan) => {
              const isSelected = effectivePlanCode === plan.planCode;
              return (
                <Box
                  key={plan.planCode}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedPlanCode(plan.planCode);
                    setDraftMenuCodes(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedPlanCode(plan.planCode);
                      setDraftMenuCodes(null);
                    }
                  }}
                  sx={{
                    border: '1px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    bgcolor: isSelected
                      ? 'action.selected'
                      : 'background.paper',
                    borderRadius: 1,
                    px: 1.5,
                    py: 1.2,
                    cursor: 'pointer',
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography variant="body2" fontWeight={700}>
                      {plan.planCode}
                    </Typography>
                    <Chip
                      label={plan.useAt === 'Y' ? '활성' : '비활성'}
                      size="small"
                      color={plan.useAt === 'Y' ? 'success' : 'default'}
                      variant={plan.useAt === 'Y' ? 'filled' : 'outlined'}
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {plan.planName || '-'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    메뉴 {plan.menuCount}개 · 기능 {plan.featureCount}개
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </Paper>

        <Stack spacing={2} sx={{ flex: 1 }}>
          <Paper sx={{ p: 2 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1.5 }}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                메뉴 매핑
              </Typography>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saveMutation.isPending || !effectivePlanCode}
              >
                저장
              </Button>
            </Stack>

            {menusQuery.isError || planMenusQuery.isError ? (
              <Alert severity="warning">
                메뉴 매핑 정보를 불러오지 못했습니다.
              </Alert>
            ) : null}

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width={70}>선택</TableCell>
                  <TableCell>메뉴 코드</TableCell>
                  <TableCell>메뉴명</TableCell>
                  <TableCell>경로</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(menusQuery.data ?? []).map((menu) => {
                  const menuCode = menu.menuCode || menu.menuId;
                  const checked = selectedMenuCodes.includes(menuCode);
                  return (
                    <TableRow key={menu.menuId} hover>
                      <TableCell>
                        <Checkbox
                          checked={checked}
                          onChange={() => toggleMenuCode(menuCode)}
                        />
                      </TableCell>
                      <TableCell>{menuCode}</TableCell>
                      <TableCell>{menu.menuNm}</TableCell>
                      <TableCell>{menu.menuUrl || '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
              기능 조회
            </Typography>
            {planFeaturesQuery.isError ? (
              <Alert severity="warning">기능 정보를 불러오지 못했습니다.</Alert>
            ) : null}
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {featureEntries.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  등록된 기능 정보가 없습니다.
                </Typography>
              ) : (
                featureEntries.map(([featureCode, enabled]) => (
                  <Chip
                    key={featureCode}
                    label={`${featureCode} : ${enabled ? 'ON' : 'OFF'}`}
                    size="small"
                    color={enabled ? 'success' : 'default'}
                    variant={enabled ? 'filled' : 'outlined'}
                  />
                ))
              )}
            </Stack>
          </Paper>
        </Stack>
      </Stack>
    </Stack>
  );
}
