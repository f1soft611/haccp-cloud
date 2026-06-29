import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Skeleton,
  Select,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined';
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import FactoryOutlinedIcon from '@mui/icons-material/FactoryOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@mui/material/styles';
import { Fragment, useMemo, useState } from 'react';
import { APP_LABELS } from '../../../shared/constants/labels';
import { ConfirmDialog } from '../../../shared/components/feedback/ConfirmDialog';
import { FormDialog } from '../../../shared/components/forms/FormDialog';
import { AdminGrid } from '../../../shared/components/data/AdminGrid';
import { GridPaginationBar } from '../../../shared/components/data/GridPaginationBar';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { useFeedback } from '../../../shared/hooks/useFeedback';
import { useGridPagination } from '../../../shared/hooks/useGridPagination';
import { extractApiErrorMessage } from '../../../services/api/errorMessage';
import { getCurrentPlanAccess } from '../../../services/platform-admin/planAccessService';
import {
  isFeatureAllowed,
  resolveFeatureCodeByButton,
} from '../../../services/platform-admin/featureCatalog';
import {
  createPlatformMenu,
  deletePlatformMenu,
  listPlatformMenusPaged,
  listPlatformMenus,
  updatePlatformMenu,
  type PlatformMenuItem,
} from '../../../services/platform-admin/platformMenuService';

const ICON_OPTIONS = [
  'Dashboard',
  'Settings',
  'Menu',
  'Factory',
  'AdminPanelSettings',
  'Business',
  'People',
  'Assignment',
  'Inventory',
  'Build',
  'Category',
  'Security',
  'Link',
  'History',
  'AccessTime',
];

const ICON_COMPONENTS: Record<string, typeof DashboardOutlinedIcon> = {
  Dashboard: DashboardOutlinedIcon,
  Settings: SettingsOutlinedIcon,
  Menu: MenuOutlinedIcon,
  Factory: FactoryOutlinedIcon,
  AdminPanelSettings: AdminPanelSettingsOutlinedIcon,
  Business: BusinessOutlinedIcon,
  People: PeopleOutlineOutlinedIcon,
  Assignment: AssignmentOutlinedIcon,
  Inventory: Inventory2OutlinedIcon,
  Build: BuildOutlinedIcon,
  Category: CategoryOutlinedIcon,
  Security: SecurityOutlinedIcon,
  Link: LinkOutlinedIcon,
  History: HistoryOutlinedIcon,
  AccessTime: AccessTimeOutlinedIcon,
};

function normalizeParentMenuId(
  parentMenuId: string | null | undefined,
): string | null {
  if (parentMenuId == null) {
    return null;
  }

  const trimmed = parentMenuId.trim();
  return trimmed === '' ? null : trimmed;
}

export function PlatformMenuManagementPage() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useFeedback();
  const { pageIndex, pageSize, setPageIndex, setPageSize, resetPage } =
    useGridPagination();

  const [searchField, setSearchField] = useState('menuNm');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [appliedFilters, setAppliedFilters] = useState({
    searchField: 'menuNm',
    searchKeyword: '',
    useAt: 'all',
  });
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PlatformMenuItem | null>(null);
  const [confirmState, setConfirmState] = useState<{
    type: 'save' | 'delete';
    title: string;
    description: string;
    confirmText: string;
    confirmColor: 'primary' | 'error';
    targetMenuId?: string;
  } | null>(null);
  const [formData, setFormData] = useState<{
    menuCode: string;
    menuNm: string;
    menuDc: string;
    menuUrl: string;
    parentMenuId: string | null;
    menuOrdr: number;
    iconNm: string;
    useAt: 'Y' | 'N';
  }>({
    menuCode: '',
    menuNm: '',
    menuDc: '',
    menuUrl: '',
    parentMenuId: null,
    menuOrdr: 0,
    iconNm: 'Menu',
    useAt: 'Y',
  });

  const fullMenusQuery = useQuery({
    queryKey: ['platform-admin', 'menus'],
    queryFn: listPlatformMenus,
  });

  const menusQuery = useQuery({
    queryKey: [
      'platform-admin',
      'menus-paged',
      pageIndex,
      pageSize,
      appliedFilters.searchField,
      appliedFilters.searchKeyword,
      appliedFilters.useAt,
    ],
    queryFn: () =>
      listPlatformMenusPaged({
        pageIndex,
        pageSize,
        searchField: appliedFilters.searchField as
          | 'menuNm'
          | 'menuDc'
          | 'menuUrl',
        searchKeyword: appliedFilters.searchKeyword || undefined,
        useAt: appliedFilters.useAt as 'Y' | 'N' | 'all',
      }),
  });

  const planAccessQuery = useQuery({
    queryKey: ['current-plan-access'],
    queryFn: getCurrentPlanAccess,
    retry: false,
  });

  const canManageMenus = isFeatureAllowed(
    planAccessQuery.data?.features,
    resolveFeatureCodeByButton('platform-menu-create'),
  );

  const createMutation = useMutation({
    mutationFn: createPlatformMenu,
    onSuccess: () => {
      resetForm();
      setModalOpen(false);
      setConfirmState(null);
      showSuccess('메뉴가 등록되었습니다.');
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'menus'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'menus-paged'],
      });
    },
    onError: (error) => {
      showError(extractApiErrorMessage(error, '메뉴 등록에 실패했습니다.'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: updatePlatformMenu,
    onSuccess: () => {
      resetForm();
      setModalOpen(false);
      setConfirmState(null);
      showSuccess('메뉴가 수정되었습니다.');
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'menus'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'menus-paged'],
      });
    },
    onError: (error) => {
      showError(extractApiErrorMessage(error, '메뉴 수정에 실패했습니다.'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePlatformMenu,
    onSuccess: () => {
      setConfirmState(null);
      showSuccess('메뉴가 삭제되었습니다.');
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'menus'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'menus-paged'],
      });
    },
    onError: (error) => {
      showError(extractApiErrorMessage(error, '메뉴 삭제에 실패했습니다.'));
    },
  });

  const pageMenus = useMemo(() => {
    const items = (menusQuery.data?.items ?? []).map((menu) => ({
      ...menu,
      parentMenuId: normalizeParentMenuId(menu.parentMenuId),
    }));
    return items;
  }, [menusQuery.data?.items]);

  const pageMenuIdSet = useMemo(
    () => new Set(pageMenus.map((menu) => menu.menuId)),
    [pageMenus],
  );

  const fullMenuNameById = useMemo(
    () =>
      new Map(
        (fullMenusQuery.data ?? []).map((menu) => [menu.menuId, menu.menuNm]),
      ),
    [fullMenusQuery.data],
  );

  const rootMenus = useMemo(
    () =>
      pageMenus.filter(
        (menu) => normalizeParentMenuId(menu.parentMenuId) === null,
      ),
    [pageMenus],
  );

  const visibleMenus = useMemo(() => {
    if (rootMenus.length === 0) {
      return pageMenus;
    }

    const orphanChildren = pageMenus.filter(
      (menu) =>
        normalizeParentMenuId(menu.parentMenuId) !== null &&
        !pageMenuIdSet.has(normalizeParentMenuId(menu.parentMenuId) ?? ''),
    );

    return [...rootMenus, ...orphanChildren];
  }, [rootMenus, pageMenus, pageMenuIdSet]);

  const isOrphanChildOnPage = (menu: PlatformMenuItem): boolean => {
    const parentId = normalizeParentMenuId(menu.parentMenuId);
    return parentId !== null && !pageMenuIdSet.has(parentId);
  };

  const getChildMenus = (parentId: string): PlatformMenuItem[] => {
    return pageMenus.filter(
      (menu) => normalizeParentMenuId(menu.parentMenuId) === parentId,
    );
  };

  const handleSearch = () => {
    resetPage();
    setAppliedFilters({
      searchField,
      searchKeyword: searchKeyword.trim(),
      useAt: filterActive,
    });
  };

  const resetForm = () => {
    setFormData({
      menuCode: '',
      menuNm: '',
      menuDc: '',
      menuUrl: '',
      parentMenuId: null,
      menuOrdr: 0,
      iconNm: 'Menu',
      useAt: 'Y',
    });
    setEditTarget(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEditModal = (menu: PlatformMenuItem) => {
    setEditTarget(menu);
    setFormData({
      menuCode: menu.menuCode ?? '',
      menuNm: menu.menuNm,
      menuDc: menu.menuDc,
      menuUrl: menu.menuUrl,
      parentMenuId: normalizeParentMenuId(menu.parentMenuId),
      menuOrdr: menu.menuOrdr,
      iconNm: menu.iconNm,
      useAt: menu.useAt,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    const isRootMenu = formData.parentMenuId == null;

    if (!formData.menuNm.trim() || (!isRootMenu && !formData.menuUrl.trim())) {
      return;
    }

    setConfirmState({
      type: 'save',
      title: editTarget ? '메뉴 수정 확인' : '메뉴 등록 확인',
      description: editTarget
        ? '수정한 메뉴 정보를 저장하시겠습니까?'
        : '입력한 메뉴 정보를 등록하시겠습니까?',
      confirmText: editTarget ? '저장' : '등록',
      confirmColor: 'primary',
    });
  };

  const executeSave = () => {
    if (editTarget) {
      updateMutation.mutate({
        menuId: editTarget.menuId,
        menuNm: formData.menuNm,
        menuDc: formData.menuDc,
        menuUrl: formData.menuUrl,
        parentMenuId: formData.parentMenuId,
        menuOrdr: formData.menuOrdr,
        iconNm: formData.iconNm,
        useAt: formData.useAt,
      });
      return;
    }

    createMutation.mutate({
      menuCode: formData.menuCode,
      menuNm: formData.menuNm,
      menuDc: formData.menuDc,
      menuUrl: formData.menuUrl,
      parentMenuId: formData.parentMenuId,
      menuOrdr: formData.menuOrdr,
      iconNm: formData.iconNm,
      useAt: formData.useAt,
    });
  };

  const handleDelete = (menu: PlatformMenuItem) => {
    setConfirmState({
      type: 'delete',
      title: '메뉴 삭제 확인',
      description: `'${menu.menuNm}' 메뉴를 삭제하시겠습니까? 삭제 후에는 되돌릴 수 없습니다.`,
      confirmText: '삭제',
      confirmColor: 'error',
      targetMenuId: menu.menuId,
    });
  };

  const handleConfirmAction = () => {
    if (!confirmState) {
      return;
    }

    if (confirmState.type === 'delete' && confirmState.targetMenuId) {
      deleteMutation.mutate(confirmState.targetMenuId);
      return;
    }

    executeSave();
  };

  const toggleExpanded = (menuId: string) => {
    const nextExpanded = new Set(expandedIds);
    if (nextExpanded.has(menuId)) {
      nextExpanded.delete(menuId);
    } else {
      nextExpanded.add(menuId);
    }
    setExpandedIds(nextExpanded);
  };

  const isLoading = menusQuery.isLoading;
  const isError = menusQuery.isError;
  const dialogDescription = editTarget
    ? '메뉴 정보를 수정하고 저장하면 즉시 목록에 반영됩니다.'
    : '새 메뉴를 등록해 플랫폼 화면과 권한 설정에 연결할 수 있습니다.';

  return (
    <Stack spacing={2} data-testid="platform-menu-management-page">
      <PageHeader
        groupLabel={APP_LABELS.menu.platformGroup}
        title={APP_LABELS.pageTitle.platformMenuManagement}
        description={dialogDescription}
      />

      {createMutation.isError ||
      updateMutation.isError ||
      deleteMutation.isError ? (
        <Alert severity="error">작업 처리에 실패했습니다.</Alert>
      ) : null}

      {isError ? (
        <Alert severity="error">메뉴 목록을 불러올 수 없습니다.</Alert>
      ) : null}

      {planAccessQuery.isSuccess && !canManageMenus ? (
        <Alert severity="info">
          현재 요금제에서는 메뉴 변경 기능이 제한됩니다. 요금제를 확인해주세요.
        </Alert>
      ) : null}

      <Paper sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          alignItems="flex-end"
        >
          <Box sx={{ minWidth: 120 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              검색 조건
            </Typography>
            <Select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              size="small"
              fullWidth
            >
              <MenuItem value="menuNm">메뉴명</MenuItem>
              <MenuItem value="menuDc">설명</MenuItem>
              <MenuItem value="menuUrl">URL</MenuItem>
            </Select>
          </Box>

          <TextField
            label="검색어"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 200 }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleSearch();
              }
            }}
          />

          <Box sx={{ minWidth: 120 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              사용여부
            </Typography>
            <Select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              size="small"
              fullWidth
            >
              <MenuItem value="all">전체</MenuItem>
              <MenuItem value="Y">사용</MenuItem>
              <MenuItem value="N">미사용</MenuItem>
            </Select>
          </Box>

          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={isLoading}
          >
            조회
          </Button>

          <Button
            variant="contained"
            onClick={handleOpenAddModal}
            disabled={isLoading || !canManageMenus}
          >
            + 메뉴 추가
          </Button>
        </Stack>
      </Paper>

      <AdminGrid ariaLabel="메뉴 목록">
        <TableHead>
          <TableRow>
            <TableCell width="30">확장</TableCell>
            <TableCell>메뉴명</TableCell>
            <TableCell>설명</TableCell>
            <TableCell>URL</TableCell>
            <TableCell width="80">순서</TableCell>
            <TableCell width="80">아이콘</TableCell>
            <TableCell width="80">사용여부</TableCell>
            <TableCell width="100" align="center">
              작업
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow
                key={`platform-menu-grid-skeleton-${index}`}
                data-testid={`platform-menu-grid-skeleton-row-${index}`}
              >
                <TableCell align="center">
                  <Skeleton variant="circular" width={24} height={24} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="70%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="85%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rounded" width="90%" height={24} />
                </TableCell>
                <TableCell align="center">
                  <Skeleton variant="text" width={24} sx={{ mx: 'auto' }} />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="circular"
                    width={24}
                    height={24}
                    sx={{ mx: 'auto' }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="rounded"
                    width={48}
                    height={24}
                    sx={{ mx: 'auto' }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Skeleton variant="circular" width={26} height={26} />
                    <Skeleton variant="circular" width={26} height={26} />
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          ) : pageMenus.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center">
                메뉴가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            visibleMenus.map((rootMenu) => {
              const childMenus = getChildMenus(rootMenu.menuId);

              return (
                <Fragment key={rootMenu.menuId}>
                  <TableRow
                    sx={{
                      '& .MuiTableCell-root': {
                        backgroundColor: isDarkMode ? '#111827' : '#ffffff',
                      },
                      '&:nth-of-type(even) .MuiTableCell-root': {
                        backgroundColor: isDarkMode ? '#162032' : '#fbfdff',
                      },
                      '&:hover .MuiTableCell-root': {
                        backgroundColor: isDarkMode ? '#1b2535' : '#f2f7ff',
                      },
                    }}
                  >
                    <TableCell align="center">
                      {childMenus.length > 0 ? (
                        <IconButton
                          size="small"
                          onClick={() => toggleExpanded(rootMenu.menuId)}
                        >
                          {expandedIds.has(rootMenu.menuId) ? (
                            <ExpandLessOutlinedIcon fontSize="small" />
                          ) : (
                            <ExpandMoreOutlinedIcon fontSize="small" />
                          )}
                        </IconButton>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {rootMenu.menuNm}
                        </Typography>
                        {isOrphanChildOnPage(rootMenu) ? (
                          <Typography variant="caption" color="text.secondary">
                            상위 메뉴:{' '}
                            {normalizeParentMenuId(rootMenu.parentMenuId)
                              ? (fullMenuNameById.get(
                                  normalizeParentMenuId(rootMenu.parentMenuId)!,
                                ) ??
                                normalizeParentMenuId(rootMenu.parentMenuId))
                              : '-'}
                          </Typography>
                        ) : null}
                      </Box>
                    </TableCell>
                    <TableCell>{rootMenu.menuDc}</TableCell>
                    <TableCell>
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-block',
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          bgcolor: isDarkMode
                            ? 'rgba(251, 191, 36, 0.14)'
                            : 'rgba(31, 79, 143, 0.08)',
                          color: isDarkMode ? '#fef3c7' : '#184173',
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                        }}
                      >
                        {rootMenu.menuUrl}
                      </Box>
                    </TableCell>
                    <TableCell align="center">{rootMenu.menuOrdr}</TableCell>
                    <TableCell align="center">
                      <Box
                        component="span"
                        title={rootMenu.iconNm}
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          bgcolor: isDarkMode
                            ? 'rgba(251, 191, 36, 0.14)'
                            : 'rgba(31, 79, 143, 0.10)',
                          color: isDarkMode ? '#fbbf24' : '#1f4f8f',
                          fontSize: '0.95rem',
                          fontWeight: 800,
                          lineHeight: 1,
                        }}
                      >
                        {(() => {
                          const IconComponent =
                            ICON_COMPONENTS[rootMenu.iconNm];
                          return IconComponent ? (
                            <IconComponent fontSize="small" />
                          ) : (
                            <MenuOutlinedIcon fontSize="small" />
                          );
                        })()}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={rootMenu.useAt === 'Y' ? '사용' : '미사용'}
                        size="small"
                        color={rootMenu.useAt === 'Y' ? 'success' : 'default'}
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEditModal(rootMenu)}
                        disabled={!canManageMenus}
                        sx={{
                          mr: 0.25,
                          color: isDarkMode ? '#fbbf24' : '#1f4f8f',
                          bgcolor: isDarkMode
                            ? 'rgba(251, 191, 36, 0.12)'
                            : 'rgba(31, 79, 143, 0.08)',
                          '&:hover': {
                            bgcolor: isDarkMode
                              ? 'rgba(251, 191, 36, 0.2)'
                              : 'rgba(31, 79, 143, 0.16)',
                          },
                        }}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(rootMenu)}
                        disabled={
                          !canManageMenus ||
                          Boolean(rootMenu.hasChildren) ||
                          deleteMutation.isPending
                        }
                        sx={{
                          color: isDarkMode ? '#f87171' : '#c53b3b',
                          bgcolor: isDarkMode
                            ? 'rgba(248, 113, 113, 0.12)'
                            : 'rgba(197, 59, 59, 0.08)',
                          '&:hover': {
                            bgcolor: isDarkMode
                              ? 'rgba(248, 113, 113, 0.2)'
                              : 'rgba(197, 59, 59, 0.16)',
                          },
                        }}
                      >
                        <DeleteOutlineOutlinedIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>

                  {expandedIds.has(rootMenu.menuId)
                    ? childMenus.map((childMenu) => (
                        <TableRow
                          key={childMenu.menuId}
                          sx={{
                            '& .MuiTableCell-root': {
                              backgroundColor: isDarkMode
                                ? '#0f172a'
                                : '#f8fbff',
                            },
                            '& .MuiTableCell-root:first-of-type': {
                              borderLeft: isDarkMode
                                ? '4px solid #fbbf24'
                                : '4px solid #1f4f8f',
                            },
                            '&:hover .MuiTableCell-root': {
                              backgroundColor: isDarkMode
                                ? '#162032'
                                : '#edf4ff',
                            },
                          }}
                        >
                          <TableCell />
                          <TableCell sx={{ pl: 4 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.75,
                              }}
                            >
                              <Box
                                component="span"
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: isDarkMode ? '#fbbf24' : '#1f4f8f',
                                  flexShrink: 0,
                                }}
                              />
                              {childMenu.menuNm}
                            </Box>
                          </TableCell>
                          <TableCell>{childMenu.menuDc}</TableCell>
                          <TableCell>
                            <Box
                              component="span"
                              sx={{
                                display: 'inline-block',
                                px: 1,
                                py: 0.25,
                                borderRadius: 1,
                                bgcolor: isDarkMode
                                  ? 'rgba(251, 191, 36, 0.14)'
                                  : 'rgba(31, 79, 143, 0.08)',
                                color: isDarkMode ? '#fef3c7' : '#184173',
                                fontFamily: 'monospace',
                                fontSize: '0.8rem',
                              }}
                            >
                              {childMenu.menuUrl}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            {childMenu.menuOrdr}
                          </TableCell>
                          <TableCell align="center">
                            <Box
                              component="span"
                              title={childMenu.iconNm}
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 30,
                                height: 30,
                                borderRadius: '50%',
                                bgcolor: isDarkMode
                                  ? 'rgba(251, 191, 36, 0.14)'
                                  : 'rgba(31, 79, 143, 0.10)',
                                color: isDarkMode ? '#fbbf24' : '#1f4f8f',
                                fontSize: '0.95rem',
                                fontWeight: 800,
                                lineHeight: 1,
                              }}
                            >
                              {(() => {
                                const IconComponent =
                                  ICON_COMPONENTS[childMenu.iconNm];
                                return IconComponent ? (
                                  <IconComponent fontSize="small" />
                                ) : (
                                  <MenuOutlinedIcon fontSize="small" />
                                );
                              })()}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={
                                childMenu.useAt === 'Y' ? '사용' : '미사용'
                              }
                              size="small"
                              color={
                                childMenu.useAt === 'Y' ? 'success' : 'default'
                              }
                              variant="filled"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditModal(childMenu)}
                              disabled={!canManageMenus}
                              sx={{
                                mr: 0.25,
                                color: '#1f4f8f',
                                bgcolor: 'rgba(31, 79, 143, 0.08)',
                                '&:hover': {
                                  bgcolor: 'rgba(31, 79, 143, 0.16)',
                                },
                              }}
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(childMenu)}
                              disabled={
                                !canManageMenus ||
                                Boolean(childMenu.hasChildren) ||
                                deleteMutation.isPending
                              }
                              sx={{
                                color: '#c53b3b',
                                bgcolor: 'rgba(197, 59, 59, 0.08)',
                                '&:hover': {
                                  bgcolor: 'rgba(197, 59, 59, 0.16)',
                                },
                              }}
                            >
                              <DeleteOutlineOutlinedIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    : null}
                </Fragment>
              );
            })
          )}
        </TableBody>
      </AdminGrid>

      <GridPaginationBar
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalCount={menusQuery.data?.totalCount ?? 0}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
      />

      <FormDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? '메뉴 수정' : '메뉴 추가'}
        description={dialogDescription}
        actions={
          <>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={(() => {
                const isRootMenu = formData.parentMenuId == null;
                return (
                  !canManageMenus ||
                  !formData.menuNm.trim() ||
                  (!isRootMenu && !formData.menuUrl.trim()) ||
                  createMutation.isPending ||
                  updateMutation.isPending
                );
              })()}
            >
              {editTarget ? '저장' : '추가'}
            </Button>
            <Button onClick={() => setModalOpen(false)}>취소</Button>
          </>
        }
      >
        <Stack spacing={2}>
          <TextField
            label="메뉴코드"
            value={formData.menuCode}
            onChange={(e) =>
              setFormData({
                ...formData,
                menuCode: e.target.value.toUpperCase(),
              })
            }
            fullWidth
            required
            disabled={Boolean(editTarget)}
            helperText={
              editTarget
                ? '메뉴코드는 생성 후 수정할 수 없습니다.'
                : '예: MENU_PLATFORM_REPORTS (미입력 시 자동 생성)'
            }
          />
          <TextField
            label="메뉴명 *"
            value={formData.menuNm}
            onChange={(e) =>
              setFormData({ ...formData, menuNm: e.target.value })
            }
            fullWidth
            required
          />
          <TextField
            label="메뉴 설명"
            value={formData.menuDc}
            onChange={(e) =>
              setFormData({ ...formData, menuDc: e.target.value })
            }
            fullWidth
            multiline
            rows={2}
          />
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              상위 메뉴
            </Typography>
            <Select
              value={formData.parentMenuId ?? 'none'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  parentMenuId:
                    e.target.value === 'none' ? null : e.target.value,
                })
              }
              fullWidth
            >
              <MenuItem value="none">없음 (루트)</MenuItem>
              {(fullMenusQuery.data ?? [])
                .filter(
                  (menu) =>
                    normalizeParentMenuId(menu.parentMenuId) === null &&
                    (!editTarget || menu.menuId !== editTarget.menuId),
                )
                .map((menu) => (
                  <MenuItem key={menu.menuId} value={menu.menuId}>
                    {menu.menuNm}
                  </MenuItem>
                ))}
            </Select>
          </Box>
          <TextField
            label={formData.parentMenuId == null ? '메뉴 URL' : '메뉴 URL *'}
            value={formData.menuUrl}
            onChange={(e) =>
              setFormData({ ...formData, menuUrl: e.target.value })
            }
            fullWidth
            required={formData.parentMenuId != null}
            placeholder={
              formData.parentMenuId == null
                ? '선택 사항 (예: /platform)'
                : '/platform/menus'
            }
          />
          <TextField
            label="순서"
            type="number"
            value={formData.menuOrdr}
            onChange={(e) =>
              setFormData({
                ...formData,
                menuOrdr: Number(e.target.value) || 0,
              })
            }
            fullWidth
          />
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              아이콘
            </Typography>
            <Select
              value={formData.iconNm}
              onChange={(e) =>
                setFormData({ ...formData, iconNm: e.target.value })
              }
              fullWidth
            >
              {ICON_OPTIONS.map((icon) => (
                <MenuItem key={icon} value={icon}>
                  {icon}
                </MenuItem>
              ))}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              사용여부
            </Typography>
            <Select
              value={formData.useAt}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  useAt: e.target.value as 'Y' | 'N',
                })
              }
              fullWidth
            >
              <MenuItem value="Y">사용</MenuItem>
              <MenuItem value="N">미사용</MenuItem>
            </Select>
          </Box>
        </Stack>
      </FormDialog>

      <ConfirmDialog
        open={confirmState !== null}
        title={confirmState?.title ?? ''}
        description={confirmState?.description ?? ''}
        confirmText={confirmState?.confirmText ?? '확인'}
        confirmColor={confirmState?.confirmColor ?? 'primary'}
        loading={
          createMutation.isPending ||
          updateMutation.isPending ||
          deleteMutation.isPending
        }
        onConfirm={handleConfirmAction}
        onClose={() => setConfirmState(null)}
      />
    </Stack>
  );
}
