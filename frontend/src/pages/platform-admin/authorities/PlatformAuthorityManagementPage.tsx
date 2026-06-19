import {
  Alert,
  Box,
  Button,
  Chip,
  Checkbox,
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
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import PowerSettingsNewOutlinedIcon from '@mui/icons-material/PowerSettingsNewOutlined';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@mui/material/styles';
import { useMemo, useState } from 'react';
import { ConfirmDialog } from '../../../shared/components/feedback/ConfirmDialog';
import { FormDialog } from '../../../shared/components/forms/FormDialog';
import { AdminGrid } from '../../../shared/components/data/AdminGrid';
import { GridPaginationBar } from '../../../shared/components/data/GridPaginationBar';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { APP_LABELS, getActiveLabel } from '../../../shared/constants/labels';
import { useFeedback } from '../../../shared/hooks/useFeedback';
import { useGridPagination } from '../../../shared/hooks/useGridPagination';
import { extractApiErrorMessage } from '../../../services/api/errorMessage';
import { listPlatformMenus } from '../../../services/platform/platformMenuService';
import {
  createPlatformRole,
  listPlatformRolesPaged,
  updatePlatformRole,
  updatePlatformRoleStatus,
  type PlatformRoleItem,
} from '../../../services/platform/platformRoleService';
import {
  getPlatformRoleMenuMapping,
  savePlatformRoleMenuMapping,
} from '../../../services/platform/platformRoleMenuService';

export function PlatformAuthorityManagementPage() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useFeedback();
  const { pageIndex, pageSize, setPageIndex, setPageSize, resetPage } =
    useGridPagination();

  const [searchField, setSearchField] = useState('name');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [appliedFilters, setAppliedFilters] = useState({
    searchField: 'name',
    searchKeyword: '',
    useAt: 'all',
  });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    useAt: 'Y' as 'Y' | 'N',
  });
  const [selectedRole, setSelectedRole] = useState<PlatformRoleItem | null>(
    null,
  );
  const [editTargetRole, setEditTargetRole] = useState<PlatformRoleItem | null>(
    null,
  );
  const [editFormData, setEditFormData] = useState({
    code: '',
    name: '',
    description: '',
    useAt: 'Y' as 'Y' | 'N',
  });
  const [draftMenuIds, setDraftMenuIds] = useState<string[] | null>(null);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    description: string;
    confirmText: string;
    action: () => void;
    color?: 'primary' | 'error' | 'warning';
  } | null>(null);

  const rolesQuery = useQuery({
    queryKey: [
      'platform-admin',
      'roles-paged',
      pageIndex,
      pageSize,
      appliedFilters.searchField,
      appliedFilters.searchKeyword,
      appliedFilters.useAt,
    ],
    queryFn: () =>
      listPlatformRolesPaged({
        pageIndex,
        pageSize,
        searchField: appliedFilters.searchField as
          | 'code'
          | 'name'
          | 'description',
        searchKeyword: appliedFilters.searchKeyword || undefined,
        useAt: appliedFilters.useAt as 'Y' | 'N' | 'all',
      }),
    retry: false,
  });

  const menusQuery = useQuery({
    queryKey: ['platform-admin', 'menus'],
    queryFn: listPlatformMenus,
  });

  const effectiveRoleCode = selectedRole?.code ?? '';

  const mappingQuery = useQuery({
    queryKey: ['platform-admin', 'role-menus', effectiveRoleCode],
    queryFn: () => getPlatformRoleMenuMapping(effectiveRoleCode),
    enabled: effectiveRoleCode.length > 0,
  });

  const selectedMenuIds = draftMenuIds ?? mappingQuery.data?.menuIds ?? [];

  const currentPageMenu = useMemo(
    () =>
      (menusQuery.data ?? []).find(
        (menu) => menu.menuUrl.trim().toLowerCase() === '/platform/roles',
      ),
    [menusQuery.data],
  );

  const pageTitle =
    currentPageMenu?.menuNm ?? APP_LABELS.pageTitle.platformRoleManagement;

  const pageDescription =
    currentPageMenu?.menuDc ||
    '권한 등록, 상태 관리, 권한별 메뉴 매핑을 한 화면에서 처리합니다.';

  const filteredRoles = useMemo(
    () => rolesQuery.data?.items ?? [],
    [rolesQuery.data?.items],
  );

  const createMutation = useMutation({
    mutationFn: createPlatformRole,
    onSuccess: () => {
      setFormData({ code: '', name: '', description: '', useAt: 'Y' });
      setCreateModalOpen(false);
      setConfirmState(null);
      showSuccess('권한이 등록되었습니다.');
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'roles'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'roles-paged'],
      });
    },
    onError: () => {
      showError('권한 등록 처리에 실패했습니다.');
    },
  });

  const statusMutation = useMutation({
    mutationFn: updatePlatformRoleStatus,
    onSuccess: () => {
      setConfirmState(null);
      showSuccess('권한 상태가 변경되었습니다.');
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'roles'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'roles-paged'],
      });
    },
    onError: () => {
      showError('권한 상태 변경에 실패했습니다.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: updatePlatformRole,
    onSuccess: () => {
      setEditModalOpen(false);
      setEditTargetRole(null);
      setConfirmState(null);
      showSuccess('권한이 수정되었습니다.');
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'roles'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'roles-paged'],
      });
    },
    onError: () => {
      showError('권한 수정 처리에 실패했습니다.');
    },
  });

  const saveMutation = useMutation({
    mutationFn: savePlatformRoleMenuMapping,
    onSuccess: (_, payload) => {
      setDraftMenuIds(null);
      setMappingModalOpen(false);
      setConfirmState(null);
      showSuccess('권한별 메뉴 매핑이 저장되었습니다.');
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'role-menus', payload.roleCode],
      });
    },
    onError: () => {
      showError('권한별 메뉴 저장에 실패했습니다.');
    },
  });

  const openCreateModal = () => {
    setFormData({ code: '', name: '', description: '', useAt: 'Y' });
    setCreateModalOpen(true);
  };

  const handleCreate = () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      return;
    }

    setConfirmState({
      title: '권한 등록 확인',
      description: '입력한 권한 정보를 등록하시겠습니까?',
      confirmText: '등록',
      action: () => {
        createMutation.mutate({
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          description: formData.description.trim(),
          active: formData.useAt === 'Y',
        });
      },
    });
  };

  const handleSearch = () => {
    resetPage();
    setAppliedFilters({
      searchField,
      searchKeyword: searchKeyword.trim(),
      useAt: filterActive,
    });
  };

  const handleToggleActive = (item: PlatformRoleItem) => {
    setConfirmState({
      title: item.active ? '권한 비활성화 확인' : '권한 활성화 확인',
      description: `'${item.name}' 권한의 상태를 변경하시겠습니까?`,
      confirmText: item.active ? '비활성화' : '활성화',
      action: () => {
        statusMutation.mutate({
          code: item.code,
          active: !item.active,
        });
      },
      color: item.active ? 'warning' : 'primary',
    });
  };

  const handleOpenMappingModal = (role: PlatformRoleItem) => {
    setSelectedRole(role);
    setDraftMenuIds(null);
    setMappingModalOpen(true);
  };

  const handleOpenEditModal = (role: PlatformRoleItem) => {
    setEditTargetRole(role);
    setEditFormData({
      code: role.code,
      name: role.name,
      description: role.description,
      useAt: role.active ? 'Y' : 'N',
    });
    setEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (!editTargetRole || !editFormData.name.trim()) {
      return;
    }

    setConfirmState({
      title: '권한 수정 확인',
      description: `'${editTargetRole.code}' 권한 정보를 저장하시겠습니까?`,
      confirmText: '저장',
      action: () => {
        updateMutation.mutate({
          code: editTargetRole.code,
          name: editFormData.name.trim(),
          description: editFormData.description.trim(),
          active: editFormData.useAt === 'Y',
        });
      },
    });
  };

  const toggleMenu = (menuId: string) => {
    setDraftMenuIds((prev) => {
      const base = prev ?? mappingQuery.data?.menuIds ?? [];
      return base.includes(menuId)
        ? base.filter((id) => id !== menuId)
        : [...base, menuId];
    });
  };

  const handleSaveMapping = () => {
    if (!selectedRole || !effectiveRoleCode) {
      return;
    }

    setConfirmState({
      title: '메뉴 매핑 저장 확인',
      description: `'${selectedRole.name}' 권한의 메뉴 매핑을 저장하시겠습니까?`,
      confirmText: '저장',
      action: () => {
        saveMutation.mutate({
          roleCode: effectiveRoleCode,
          menuIds: selectedMenuIds,
        });
      },
    });
  };

  const isBusy =
    createMutation.isPending ||
    updateMutation.isPending ||
    statusMutation.isPending ||
    saveMutation.isPending;

  const rolesErrorMessage = rolesQuery.isError
    ? extractApiErrorMessage(
        rolesQuery.error,
        '권한 목록을 불러올 수 없습니다.',
      )
    : null;

  return (
    <Stack spacing={2} data-testid="platform-authority-management-page">
      <PageHeader
        groupLabel={APP_LABELS.menu.systemGroup}
        title={pageTitle}
        description={pageDescription}
      />

      {createMutation.isError ? (
        <Alert severity="warning">권한 등록 처리에 실패했습니다.</Alert>
      ) : null}
      {statusMutation.isError ? (
        <Alert severity="warning">권한 상태 변경에 실패했습니다.</Alert>
      ) : null}
      {updateMutation.isError ? (
        <Alert severity="warning">권한 수정 처리에 실패했습니다.</Alert>
      ) : null}
      {saveMutation.isSuccess ? (
        <Alert severity="success">권한별 메뉴 매핑이 저장되었습니다.</Alert>
      ) : null}
      {saveMutation.isError ? (
        <Alert severity="warning">권한별 메뉴 저장에 실패했습니다.</Alert>
      ) : null}
      {rolesErrorMessage ? (
        <Alert severity="error" sx={{ whiteSpace: 'pre-wrap' }}>
          {rolesErrorMessage}
        </Alert>
      ) : null}

      <Paper sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          alignItems="flex-end"
        >
          <Box sx={{ minWidth: 140 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              검색 조건
            </Typography>
            <Select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              size="small"
              fullWidth
            >
              <MenuItem value="code">권한 코드</MenuItem>
              <MenuItem value="name">권한명</MenuItem>
              <MenuItem value="description">설명</MenuItem>
            </Select>
          </Box>

          <TextField
            label="검색어"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
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
              상태
            </Typography>
            <Select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              size="small"
              fullWidth
            >
              <MenuItem value="all">전체</MenuItem>
              <MenuItem value="Y">활성</MenuItem>
              <MenuItem value="N">비활성</MenuItem>
            </Select>
          </Box>

          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={rolesQuery.isLoading}
          >
            조회
          </Button>

          <Button
            variant="contained"
            onClick={openCreateModal}
            disabled={rolesQuery.isLoading}
          >
            + 권한 추가
          </Button>
        </Stack>
      </Paper>

      <AdminGrid ariaLabel="권한 목록">
        <TableHead>
          <TableRow>
            <TableCell>권한 코드</TableCell>
            <TableCell>권한명</TableCell>
            <TableCell>설명</TableCell>
            <TableCell width="100" align="center">
              {APP_LABELS.table.status}
            </TableCell>
            <TableCell width="220" align="center">
              {APP_LABELS.table.action}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rolesQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow
                key={`platform-authority-grid-skeleton-${index}`}
                data-testid={`platform-authority-grid-skeleton-row-${index}`}
              >
                <TableCell>
                  <Skeleton variant="text" width="65%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="70%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="90%" />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="rounded"
                    width={52}
                    height={24}
                    sx={{ mx: 'auto' }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Skeleton variant="circular" width={26} height={26} />
                    <Skeleton variant="circular" width={26} height={26} />
                    <Skeleton variant="circular" width={26} height={26} />
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          ) : filteredRoles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center">
                권한 데이터가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            filteredRoles.map((item) => (
              <TableRow
                key={item.code}
                hover
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
                <TableCell>{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.description || '-'}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={getActiveLabel(item.active)}
                    size="small"
                    color={item.active ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    aria-label="권한 수정"
                    onClick={() => handleOpenEditModal(item)}
                    sx={{
                      mr: 0.5,
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
                    aria-label="메뉴 매핑"
                    onClick={() => handleOpenMappingModal(item)}
                    sx={{
                      mr: 0.5,
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
                    <LinkOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={
                      item.active
                        ? APP_LABELS.action.deactivate
                        : APP_LABELS.action.activate
                    }
                    onClick={() => handleToggleActive(item)}
                    disabled={statusMutation.isPending}
                    sx={{
                      color: item.active
                        ? isDarkMode
                          ? '#f87171'
                          : '#c53b3b'
                        : isDarkMode
                          ? '#86efac'
                          : '#2e7d32',
                      bgcolor: item.active
                        ? isDarkMode
                          ? 'rgba(248, 113, 113, 0.12)'
                          : 'rgba(197, 59, 59, 0.08)'
                        : isDarkMode
                          ? 'rgba(134, 239, 172, 0.12)'
                          : 'rgba(46, 125, 50, 0.08)',
                      '&:hover': {
                        bgcolor: item.active
                          ? isDarkMode
                            ? 'rgba(248, 113, 113, 0.2)'
                            : 'rgba(197, 59, 59, 0.16)'
                          : isDarkMode
                            ? 'rgba(134, 239, 172, 0.2)'
                            : 'rgba(46, 125, 50, 0.16)',
                      },
                    }}
                  >
                    <PowerSettingsNewOutlinedIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </AdminGrid>

      <GridPaginationBar
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalCount={rolesQuery.data?.totalCount ?? 0}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
      />

      <FormDialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="권한 추가"
        description="새 권한을 등록하면 메뉴 매핑 모달에서 메뉴 접근 권한을 연결할 수 있습니다."
        actions={
          <>
            <Button
              onClick={handleCreate}
              variant="contained"
              disabled={
                !formData.code.trim() ||
                !formData.name.trim() ||
                createMutation.isPending
              }
            >
              등록
            </Button>
            <Button onClick={() => setCreateModalOpen(false)}>취소</Button>
          </>
        }
      >
        <Stack spacing={2}>
          <TextField
            label="권한 코드 *"
            value={formData.code}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                code: event.target.value.toUpperCase(),
              }))
            }
            placeholder="ROLE_QA_MANAGER"
            required
          />
          <TextField
            label="권한명 *"
            value={formData.name}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, name: event.target.value }))
            }
            required
          />
          <TextField
            label="설명"
            value={formData.description}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                description: event.target.value,
              }))
            }
            multiline
            minRows={2}
          />
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              사용여부
            </Typography>
            <Select
              value={formData.useAt}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  useAt: event.target.value as 'Y' | 'N',
                }))
              }
              fullWidth
            >
              <MenuItem value="Y">사용</MenuItem>
              <MenuItem value="N">미사용</MenuItem>
            </Select>
          </Box>
        </Stack>
      </FormDialog>

      <FormDialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="권한 수정"
        description="권한명과 사용여부를 수정할 수 있습니다."
        actions={
          <>
            <Button
              onClick={handleUpdate}
              variant="contained"
              disabled={!editFormData.name.trim() || updateMutation.isPending}
            >
              저장
            </Button>
            <Button onClick={() => setEditModalOpen(false)}>취소</Button>
          </>
        }
      >
        <Stack spacing={2}>
          <TextField
            label="권한 코드"
            value={editFormData.code}
            disabled
            fullWidth
          />
          <TextField
            label="권한명 *"
            value={editFormData.name}
            onChange={(event) =>
              setEditFormData((prev) => ({ ...prev, name: event.target.value }))
            }
            required
            fullWidth
          />
          <TextField
            label="설명"
            value={editFormData.description}
            onChange={(event) =>
              setEditFormData((prev) => ({
                ...prev,
                description: event.target.value,
              }))
            }
            multiline
            minRows={2}
          />
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              사용여부
            </Typography>
            <Select
              value={editFormData.useAt}
              onChange={(event) =>
                setEditFormData((prev) => ({
                  ...prev,
                  useAt: event.target.value as 'Y' | 'N',
                }))
              }
              fullWidth
            >
              <MenuItem value="Y">사용</MenuItem>
              <MenuItem value="N">미사용</MenuItem>
            </Select>
          </Box>
        </Stack>
      </FormDialog>

      <FormDialog
        open={mappingModalOpen}
        onClose={() => setMappingModalOpen(false)}
        maxWidth="md"
        title="권한별 메뉴 매핑"
        description={
          selectedRole
            ? `${selectedRole.name} (${selectedRole.code}) 권한에 노출할 메뉴를 선택하세요.`
            : '권한을 선택한 뒤 메뉴 매핑을 설정하세요.'
        }
        actions={
          <>
            <Button
              onClick={handleSaveMapping}
              variant="contained"
              disabled={!selectedRole || saveMutation.isPending}
            >
              저장
            </Button>
            <Button onClick={() => setMappingModalOpen(false)}>취소</Button>
          </>
        }
      >
        <AdminGrid ariaLabel="권한별 메뉴 매핑 목록" maxHeight={420}>
          <TableHead>
            <TableRow>
              <TableCell width="70" align="center">
                선택
              </TableCell>
              <TableCell>메뉴명</TableCell>
              <TableCell>설명</TableCell>
              <TableCell>URL</TableCell>
              <TableCell width="90" align="center">
                사용
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {menusQuery.isLoading || mappingQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow
                  key={`platform-role-menu-grid-skeleton-${index}`}
                  data-testid={`platform-role-menu-grid-skeleton-row-${index}`}
                >
                  <TableCell align="center">
                    <Skeleton
                      variant="rounded"
                      width={20}
                      height={20}
                      sx={{ mx: 'auto' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width="68%" />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width="88%" />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="rounded" width="92%" height={24} />
                  </TableCell>
                  <TableCell align="center">
                    <Skeleton
                      variant="rounded"
                      width={48}
                      height={24}
                      sx={{ mx: 'auto' }}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (menusQuery.data ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  등록된 메뉴가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              (menusQuery.data ?? []).map((menu) => {
                const checked = selectedMenuIds.includes(menu.menuId);
                return (
                  <TableRow key={menu.menuId} hover>
                    <TableCell align="center">
                      <Checkbox
                        checked={checked}
                        onChange={() => toggleMenu(menu.menuId)}
                        inputProps={{
                          'aria-label': `${menu.menuNm} (${menu.menuUrl})`,
                        }}
                      />
                    </TableCell>
                    <TableCell>{menu.menuNm}</TableCell>
                    <TableCell>{menu.menuDc || '-'}</TableCell>
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
                        {menu.menuUrl}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={menu.useAt === 'Y' ? '사용' : '미사용'}
                        size="small"
                        color={menu.useAt === 'Y' ? 'success' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </AdminGrid>
      </FormDialog>

      <ConfirmDialog
        open={confirmState !== null}
        title={confirmState?.title ?? ''}
        description={confirmState?.description ?? ''}
        confirmText={confirmState?.confirmText ?? '확인'}
        confirmColor={confirmState?.color ?? 'primary'}
        loading={isBusy}
        onConfirm={() => confirmState?.action()}
        onClose={() => setConfirmState(null)}
      />
    </Stack>
  );
}
