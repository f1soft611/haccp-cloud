import { Alert, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { APP_LABELS } from '../../../shared/constants/labels';
import { useFeedback } from '../../../shared/hooks/useFeedback';
import {
  getPlanFeatures,
  getPlanMenuCodes,
  listPlanSummaries,
  savePlanFeatures,
  savePlanMenuCodes,
  type PlanFeatureItem,
  type PlanSummary,
} from '../../../services/plan/planAccessService';
import { listPlatformMenus } from '../../../services/platform/platformMenuService';
import {
  PlatformPlanSearchBar,
  type PlanSearchBarValue,
} from './components/PlatformPlanSearchBar';
import { PlatformPlanGrid } from './components/PlatformPlanGrid';
import { PlanMenuMappingDialog } from './components/PlanMenuMappingDialog';
import { PlanFeatureMappingDialog } from './components/PlanFeatureMappingDialog';

export function PlatformPlanManagementPage() {
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useFeedback();
  const [searchValue, setSearchValue] = useState<PlanSearchBarValue>({
    searchField: 'name',
    searchKeyword: '',
    filterActive: 'all',
  });
  const [appliedFilters, setAppliedFilters] = useState<PlanSearchBarValue>({
    searchField: 'name',
    searchKeyword: '',
    filterActive: 'all',
  });
  const [selectedPlan, setSelectedPlan] = useState<PlanSummary | null>(null);
  const [menuMappingOpen, setMenuMappingOpen] = useState(false);
  const [featureMappingOpen, setFeatureMappingOpen] = useState(false);
  const [draftMenuCodes, setDraftMenuCodes] = useState<string[] | null>(null);
  const [draftFeatures, setDraftFeatures] = useState<PlanFeatureItem[] | null>(
    null,
  );

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

  const effectivePlanCode = selectedPlan?.planCode || '';

  const filteredPlans = useMemo(() => {
    const keyword = appliedFilters.searchKeyword.trim().toLowerCase();
    return (plansQuery.data ?? []).filter((plan) => {
      if (
        appliedFilters.filterActive !== 'all' &&
        plan.useAt !== appliedFilters.filterActive
      ) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const target =
        appliedFilters.searchField === 'code' ? plan.planCode : plan.planName;
      return target.toLowerCase().includes(keyword);
    });
  }, [plansQuery.data, appliedFilters]);

  const planFeaturesQuery = useQuery({
    queryKey: ['platform-admin', 'plan-features', effectivePlanCode],
    queryFn: () => getPlanFeatures(effectivePlanCode),
    enabled: effectivePlanCode.length > 0 && featureMappingOpen,
    retry: false,
  });

  const planMenusQuery = useQuery({
    queryKey: ['platform-admin', 'plan-menus', effectivePlanCode],
    queryFn: () => getPlanMenuCodes(effectivePlanCode),
    enabled: effectivePlanCode.length > 0 && menuMappingOpen,
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

  const saveFeatureMutation = useMutation({
    mutationFn: savePlanFeatures,
    onSuccess: async (_, payload) => {
      setDraftFeatures(null);
      showSuccess('플랜 기능 매핑이 저장되었습니다.');
      await queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'plan-features', payload.planCode],
      });
      await queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'plan-summaries'],
      });
    },
    onError: () => {
      showError('플랜 기능 매핑 저장에 실패했습니다.');
    },
  });

  const selectedFeatures = draftFeatures;

  const handleSearch = () => {
    const normalized = {
      ...searchValue,
      searchKeyword: searchValue.searchKeyword.trim(),
    };

    setAppliedFilters(normalized);
    setSelectedPlan((prev) =>
      prev && filteredPlans.some((plan) => plan.planCode === prev.planCode)
        ? prev
        : null,
    );
  };

  const handleOpenMenuMapping = (plan: PlanSummary) => {
    setSelectedPlan(plan);
    setDraftMenuCodes(null);
    setMenuMappingOpen(true);
  };

  const handleOpenFeatureMapping = (plan: PlanSummary) => {
    setSelectedPlan(plan);
    setDraftFeatures(null);
    setFeatureMappingOpen(true);
  };

  const toggleMenuCode = (menuCode: string) => {
    setDraftMenuCodes((prev) => {
      const base = prev ?? planMenusQuery.data ?? [];
      return base.includes(menuCode)
        ? base.filter((item) => item !== menuCode)
        : [...base, menuCode];
    });
  };

  const toggleFeature = (featureCode: string) => {
    setDraftFeatures((prev) => {
      const base =
        prev ??
        (planFeaturesQuery.data ?? []).map((item) => ({
          ...item,
          limitValue: item.limitValue ?? null,
        }));

      return base.map((item) => {
        if (item.featureCode !== featureCode) {
          return item;
        }

        return {
          ...item,
          enabled: !item.enabled,
        };
      });
    });
  };

  const changeFeatureLimit = (featureCode: string, value: string) => {
    setDraftFeatures((prev) => {
      const base =
        prev ??
        (planFeaturesQuery.data ?? []).map((item) => ({
          ...item,
          limitValue: item.limitValue ?? null,
        }));

      return base.map((item) => {
        if (item.featureCode !== featureCode) {
          return item;
        }

        const parsed = value.trim() === '' ? null : Number(value);
        return {
          ...item,
          limitValue: Number.isFinite(parsed) ? parsed : null,
        };
      });
    });
  };

  const handleChangeSelectedMenuCodes = (menuCodes: string[]) => {
    setDraftMenuCodes(menuCodes);
  };

  const handleCloseMenuMapping = () => {
    setMenuMappingOpen(false);
    setDraftMenuCodes(null);
  };

  const handleCloseFeatureMapping = () => {
    setFeatureMappingOpen(false);
    setDraftFeatures(null);
  };

  const featureSource = planFeaturesQuery.data ?? [];

  const mergedFeatures = useMemo(
    () => selectedFeatures ?? featureSource,
    [featureSource, selectedFeatures],
  );

  const isBusy = saveMutation.isPending || saveFeatureMutation.isPending;

  const handleSave = () => {
    if (!effectivePlanCode) {
      return;
    }

    saveMutation.mutate({
      planCode: effectivePlanCode,
      menuCodes: selectedMenuCodes,
    });
  };

  const handleSaveFeatures = () => {
    if (!effectivePlanCode) {
      return;
    }

    saveFeatureMutation.mutate({
      planCode: effectivePlanCode,
      features: mergedFeatures,
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

      <PlatformPlanSearchBar
        value={searchValue}
        disabled={plansQuery.isLoading}
        onChange={setSearchValue}
        onSearch={handleSearch}
      />

      <PlatformPlanGrid
        rows={filteredPlans}
        loading={plansQuery.isLoading}
        onMenuMapping={handleOpenMenuMapping}
        onFeatureMapping={handleOpenFeatureMapping}
      />

      <PlanMenuMappingDialog
        open={menuMappingOpen}
        plan={selectedPlan}
        menus={menusQuery.data ?? []}
        selectedMenuCodes={selectedMenuCodes}
        loading={menusQuery.isLoading || planMenusQuery.isLoading}
        saving={saveMutation.isPending}
        error={menusQuery.isError || planMenusQuery.isError}
        onChangeSelected={handleChangeSelectedMenuCodes}
        onSave={handleSave}
        onClose={handleCloseMenuMapping}
      />

      <PlanFeatureMappingDialog
        open={featureMappingOpen}
        plan={selectedPlan}
        features={mergedFeatures}
        loading={planFeaturesQuery.isLoading}
        saving={saveFeatureMutation.isPending}
        error={planFeaturesQuery.isError}
        onToggle={toggleFeature}
        onLimitChange={changeFeatureLimit}
        onSave={handleSaveFeatures}
        onClose={handleCloseFeatureMapping}
      />

      {isBusy ? <Alert severity="info">저장 처리 중입니다.</Alert> : null}
    </Stack>
  );
}
