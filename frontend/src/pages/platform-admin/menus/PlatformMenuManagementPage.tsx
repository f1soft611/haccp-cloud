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
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { APP_LABELS } from '../../../shared/constants/labels';
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

export function PlatformMenuManagementPage() {
  const queryClient = useQueryClient();

  // 검색 및 필터 상태
  const [searchField, setSearchField] = useState('menuNm');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterActive, setFilterActive] = useState('all'); // 'all' | 'Y' | 'N'

  // 확장/축소 상태
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PlatformMenuItem | null>(null);

  // 폼 상태
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

  // 데이터 조회
  const menusQuery = useQuery({
    queryKey: ['platform-admin', 'menus'],
    queryFn: listPlatformMenus,
  });

  // 생성 뮤테이션
  const createMutation = useMutation({
    mutationFn: createPlatformMenu,
    onSuccess: () => {
      resetForm();
      setModalOpen(false);
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'menus'],
      });
    },
  });

  // 수정 뮤테이션
  const updateMutation = useMutation({
    mutationFn: updatePlatformMenu,
    onSuccess: () => {
      resetForm();
      setModalOpen(false);
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'menus'],
      });
    },
  });

  // 삭제 뮤테이션
  const deleteMutation = useMutation({
    mutationFn: deletePlatformMenu,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['platform-admin', 'menus'],
      });
    },
  });

  // 필터링된 메뉴 계산
  const filteredMenus = useMemo(() => {
    const items = menusQuery.data ?? [];

    return items.filter((menu) => {
      // 사용여부 필터
      if (filterActive !== 'all' && menu.useAt !== filterActive) {
        return false;
      }

      // 검색어 필터
      if (searchKeyword.trim()) {
        const keyword = searchKeyword.toLowerCase();
        if (searchField === 'menuNm') {
          return menu.menuNm.toLowerCase().includes(keyword);
        } else if (searchField === 'menuDc') {
          return menu.menuDc.toLowerCase().includes(keyword);
        } else if (searchField === 'menuUrl') {
          return menu.menuUrl.toLowerCase().includes(keyword);
        }
      }

      return true;
    });
  }, [menusQuery.data, searchKeyword, searchField, filterActive]);

  // 루트 메뉴 및 자식 메뉴 구분
  const rootMenus = useMemo(
    () => filteredMenus.filter((menu) => menu.parentMenuId === null),
    [filteredMenus],
  );

  const getChildMenus = (parentId: string): PlatformMenuItem[] => {
    return filteredMenus.filter((menu) => menu.parentMenuId === parentId);
  };

  // 폼 초기화
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

  // 추가 모달 열기
  const handleOpenAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  // 수정 모달 열기
  const handleOpenEditModal = (menu: PlatformMenuItem) => {
    setEditTarget(menu);
    setFormData({
      menuNm: menu.menuNm,
      menuDc: menu.menuDc,
      menuUrl: menu.menuUrl,
      parentMenuId: menu.parentMenuId,
      menuOrdr: menu.menuOrdr,
      iconNm: menu.iconNm,
      useAt: menu.useAt,
    });
    setModalOpen(true);
  };

  // 저장
  const handleSave = () => {
    if (!formData.menuNm.trim() || !formData.menuUrl.trim()) {
      return;
    }

    if (editTarget) {
      updateMutation.mutate({
        menuId: editTarget.menuId,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  // 삭제
  const handleDelete = (menu: PlatformMenuItem) => {
    if (confirm(`'${menu.menuNm}'를 삭제하시겠습니까?`)) {
      deleteMutation.mutate(menu.menuId);
    }
  };

  // 확장/축소 토글
  const toggleExpanded = (menuId: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId);
    } else {
      newExpanded.add(menuId);
    }
    setExpandedIds(newExpanded);
  };

  const isLoading = menusQuery.isLoading;
  const isError = menusQuery.isError;

  return (
    <Stack spacing={2} data-testid="platform-menu-management-page">
      <Typography variant="h4">
        {APP_LABELS.pageTitle.platformMenuManagement}
      </Typography>

      {createMutation.isError ||
      updateMutation.isError ||
      deleteMutation.isError ? (
        <Alert severity="error">작업 처리에 실패했습니다.</Alert>
      ) : null}

      {isError ? (
        <Alert severity="error">메뉴 목록을 불러올 수 없습니다.</Alert>
      ) : null}

      {/* 검색 필터 */}
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

      {/* 메뉴 테이블 */}
      <Table size="small">
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
              <Box component={TableRow} key={rootMenu.menuId}>
                <TableCell align="center">
                  {(getChildMenus(rootMenu.menuId).length ?? 0) > 0 ? (
                    <IconButton
                      size="small"
                      onClick={() => toggleExpanded(rootMenu.menuId)}
                    >
                      {expandedIds.has(rootMenu.menuId) ? (
                        <ExpandLessIcon fontSize="small" />
                      ) : (
                        <ExpandMoreIcon fontSize="small" />
                      )}
                    </IconButton>
                  ) : null}
                </TableCell>
                <TableCell>{rootMenu.menuNm}</TableCell>
                <TableCell>{rootMenu.menuDc}</TableCell>
                <TableCell sx={{ fontSize: '0.875rem' }}>
                  {rootMenu.menuUrl}
                </TableCell>
                <TableCell align="center">{rootMenu.menuOrdr}</TableCell>
                <TableCell align="center">{rootMenu.iconNm}</TableCell>
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
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(rootMenu)}
                    disabled={
                      (getChildMenus(rootMenu.menuId).length ?? 0) > 0 ||
                      deleteMutation.isPending
                    }
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </Box>
            ))
          )}

          {/* 자식 메뉴 렌더링 */}
          {rootMenus.map((rootMenu) =>
            expandedIds.has(rootMenu.menuId)
              ? getChildMenus(rootMenu.menuId).map((childMenu) => (
                  <TableRow key={childMenu.menuId} sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell></TableCell>
                    <TableCell sx={{ pl: 4 }}>├ {childMenu.menuNm}</TableCell>
                    <TableCell>{childMenu.menuDc}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>
                      {childMenu.menuUrl}
                    </TableCell>
                    <TableCell align="center">{childMenu.menuOrdr}</TableCell>
                    <TableCell align="center">{childMenu.iconNm}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={childMenu.useAt === 'Y' ? '사용' : '미사용'}
                        size="small"
                        color={childMenu.useAt === 'Y' ? 'success' : 'default'}
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEditModal(childMenu)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(childMenu)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              : null,
          )}
        </TableBody>
      </Table>

      {/* 추가/수정 모달 */}
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
                    (m) =>
                      m.parentMenuId === null &&
                      (!editTarget || m.menuId !== editTarget.menuId),
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
    </Stack>
  );
}
