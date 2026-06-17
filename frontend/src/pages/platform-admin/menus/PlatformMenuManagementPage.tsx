import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
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
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { APP_LABELS } from '../../../shared/constants/labels';
import { ConfirmDialog } from '../../../shared/components/feedback/ConfirmDialog';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { useFeedback } from '../../../shared/hooks/useFeedback';
import {
  createPlatformMenu,
  deletePlatformMenu,
  listPlatformMenus,
  updatePlatformMenu,
  type PlatformMenuItem,
} from '../../../services/platform/platformMenuService';

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
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useFeedback();

  const [searchField, setSearchField] = useState('menuNm');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterActive, setFilterActive] = useState('all');
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
    menuNm: string;
    menuDc: string;
    menuUrl: string;
    parentMenuId: string | null;
    menuOrdr: number;
    iconNm: string;
    useAt: 'Y' | 'N';
  }>({
    menuNm: '',
    menuDc: '',
    menuUrl: '',
    parentMenuId: null,
    menuOrdr: 0,
    iconNm: 'Menu',
    useAt: 'Y',
  });

  const menusQuery = useQuery({
    queryKey: ['platform-admin', 'menus'],
    queryFn: listPlatformMenus,
  });

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
    },
    onError: () => {
      showError('메뉴 등록에 실패했습니다.');
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
    },
    onError: () => {
      showError('메뉴 수정에 실패했습니다.');
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
    },
    onError: () => {
      showError('메뉴 삭제에 실패했습니다.');
    },
  });

  const filteredMenus = useMemo(() => {
    const items = (menusQuery.data ?? []).map((menu) => ({
      ...menu,
      parentMenuId: normalizeParentMenuId(menu.parentMenuId),
    }));

    return items.filter((menu) => {
      if (filterActive !== 'all' && menu.useAt !== filterActive) {
        return false;
      }

      if (searchKeyword.trim()) {
        const keyword = searchKeyword.toLowerCase();
        if (searchField === 'menuNm') {
          return menu.menuNm.toLowerCase().includes(keyword);
        }
        if (searchField === 'menuDc') {
          return menu.menuDc.toLowerCase().includes(keyword);
        }
        if (searchField === 'menuUrl') {
          return menu.menuUrl.toLowerCase().includes(keyword);
        }
      }

      return true;
    });
  }, [menusQuery.data, searchKeyword, searchField, filterActive]);

  const rootMenus = useMemo(
    () =>
      filteredMenus.filter(
        (menu) => normalizeParentMenuId(menu.parentMenuId) === null,
      ),
    [filteredMenus],
  );

  const getChildMenus = (parentId: string): PlatformMenuItem[] => {
    return filteredMenus.filter(
      (menu) => normalizeParentMenuId(menu.parentMenuId) === parentId,
    );
  };

  const resetForm = () => {
    setFormData({
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
    if (!formData.menuNm.trim() || !formData.menuUrl.trim()) {
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
        ...formData,
      });
      return;
    }

    createMutation.mutate(formData);
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
        groupLabel={APP_LABELS.menu.systemGroup}
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
            onClick={handleOpenAddModal}
            disabled={isLoading}
          >
            + 메뉴 추가
          </Button>
        </Stack>
      </Paper>

      <TableContainer
        component={Paper}
        sx={{
          border: '1px solid rgba(31, 79, 143, 0.22)',
          borderRadius: 2,
          boxShadow: '0 10px 28px rgba(17, 43, 74, 0.1)',
          overflow: 'auto',
          bgcolor: '#fff',
          maxHeight: 620,
        }}
      >
        <Table
          size="small"
          stickyHeader
          aria-label="메뉴 목록"
          sx={{
            '& .MuiTableCell-head': {
              bgcolor: '#1f4f8f',
              color: '#ffffff',
              fontWeight: 700,
              borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
            },
            '& .MuiTableCell-root': {
              borderBottom: '1px solid rgba(31, 79, 143, 0.12)',
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell width="30">확장</TableCell>
              <TableCell>메뉴명</TableCell>
              <TableCell>설명</TableCell>
              <TableCell>URL</TableCell>
              <TableCell width="80">순서</TableCell>
              <TableCell width="80">아이콘</TableCell>
              <TableCell width="80">사용여부</TableCell>
              <TableCell width="100" align="right">
                작업
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  로딩 중...
                </TableCell>
              </TableRow>
            ) : rootMenus.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  메뉴가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              rootMenus.map((rootMenu) => (
                <TableRow
                  key={rootMenu.menuId}
                  sx={{
                    '& .MuiTableCell-root': { backgroundColor: '#ffffff' },
                    '&:nth-of-type(even) .MuiTableCell-root': {
                      backgroundColor: '#fbfdff',
                    },
                    '&:hover .MuiTableCell-root': {
                      backgroundColor: '#f2f7ff',
                    },
                  }}
                >
                  <TableCell align="center">
                    {getChildMenus(rootMenu.menuId).length > 0 ? (
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
                  <TableCell>{rootMenu.menuNm}</TableCell>
                  <TableCell>{rootMenu.menuDc}</TableCell>
                  <TableCell>
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-block',
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        bgcolor: 'rgba(31, 79, 143, 0.08)',
                        color: '#184173',
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
                        bgcolor: 'rgba(31, 79, 143, 0.10)',
                        color: '#1f4f8f',
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        lineHeight: 1,
                      }}
                    >
                      {(() => {
                        const IconComponent = ICON_COMPONENTS[rootMenu.iconNm];
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
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenEditModal(rootMenu)}
                      sx={{
                        mr: 0.25,
                        color: '#1f4f8f',
                        bgcolor: 'rgba(31, 79, 143, 0.08)',
                        '&:hover': { bgcolor: 'rgba(31, 79, 143, 0.16)' },
                      }}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(rootMenu)}
                      disabled={
                        getChildMenus(rootMenu.menuId).length > 0 ||
                        deleteMutation.isPending
                      }
                      sx={{
                        color: '#c53b3b',
                        bgcolor: 'rgba(197, 59, 59, 0.08)',
                        '&:hover': { bgcolor: 'rgba(197, 59, 59, 0.16)' },
                      }}
                    >
                      <DeleteOutlineOutlinedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}

            {rootMenus.map((rootMenu) =>
              expandedIds.has(rootMenu.menuId)
                ? getChildMenus(rootMenu.menuId).map((childMenu) => (
                    <TableRow
                      key={childMenu.menuId}
                      sx={{
                        '& .MuiTableCell-root': { backgroundColor: '#f8fbff' },
                        '& .MuiTableCell-root:first-of-type': {
                          borderLeft: '4px solid #1f4f8f',
                        },
                        '&:hover .MuiTableCell-root': {
                          backgroundColor: '#edf4ff',
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
                              bgcolor: '#1f4f8f',
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
                            bgcolor: 'rgba(31, 79, 143, 0.08)',
                            color: '#184173',
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                          }}
                        >
                          {childMenu.menuUrl}
                        </Box>
                      </TableCell>
                      <TableCell align="center">{childMenu.menuOrdr}</TableCell>
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
                            bgcolor: 'rgba(31, 79, 143, 0.10)',
                            color: '#1f4f8f',
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
                          label={childMenu.useAt === 'Y' ? '사용' : '미사용'}
                          size="small"
                          color={
                            childMenu.useAt === 'Y' ? 'success' : 'default'
                          }
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditModal(childMenu)}
                          sx={{
                            mr: 0.25,
                            color: '#1f4f8f',
                            bgcolor: 'rgba(31, 79, 143, 0.08)',
                            '&:hover': { bgcolor: 'rgba(31, 79, 143, 0.16)' },
                          }}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(childMenu)}
                          sx={{
                            color: '#c53b3b',
                            bgcolor: 'rgba(197, 59, 59, 0.08)',
                            '&:hover': { bgcolor: 'rgba(197, 59, 59, 0.16)' },
                          }}
                        >
                          <DeleteOutlineOutlinedIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                : null,
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editTarget ? '메뉴 수정' : '메뉴 추가'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
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
                {(menusQuery.data ?? [])
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
              label="메뉴 URL *"
              value={formData.menuUrl}
              onChange={(e) =>
                setFormData({ ...formData, menuUrl: e.target.value })
              }
              fullWidth
              required
              placeholder="/platform/menus"
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>취소</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={
              !formData.menuNm.trim() ||
              !formData.menuUrl.trim() ||
              createMutation.isPending ||
              updateMutation.isPending
            }
          >
            {editTarget ? '저장' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>

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
