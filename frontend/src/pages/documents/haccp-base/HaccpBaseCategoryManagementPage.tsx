import {
  Alert,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useMemo, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { extractApiErrorMessage } from '../../../services/api/errorMessage';
import {
  createHaccpBaseCategory,
  listHaccpBaseCategories,
  updateHaccpBaseCategory,
  type HaccpBaseCategoryItem,
} from '../../../services/documents/haccpBaseCategoryService';
import { AdminGrid } from '../../../shared/components/data/AdminGrid';
import { ConfirmDialog } from '../../../shared/components/feedback/ConfirmDialog';
import { FormDialog } from '../../../shared/components/forms/FormDialog';
import { useFeedback } from '../../../shared/hooks/useFeedback';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { APP_LABELS } from '../../../shared/constants/labels';
import { useAuthStore } from '../../../shared/store/authStore';

type CategoryRow = {
  id: string;
  no: number;
  categoryCode: string;
  categoryName: string;
  sortOrder: number;
  createdBy: string;
  createdAt: string;
  useAt: 'Y' | 'N';
};

type CategoryCreateForm = {
  categoryCode: string;
  categoryName: string;
  sortOrder: number;
  useAt: 'Y' | 'N';
};

const DEFAULT_CATEGORY_FORM: CategoryCreateForm = {
  categoryCode: '',
  categoryName: '',
  sortOrder: 1,
  useAt: 'Y',
};

function toCategoryRow(
  item: HaccpBaseCategoryItem,
  index: number,
): CategoryRow {
  return {
    id: item.id,
    no: index + 1,
    categoryCode: item.categoryCode,
    categoryName: item.categoryName,
    sortOrder: item.sortOrder,
    createdBy: item.createdBy || '-',
    createdAt: item.createdAt || '-',
    useAt: item.active ? 'Y' : 'N',
  };
}

export function HaccpBaseCategoryManagementPage() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useFeedback();
  const tenantCode = useAuthStore((state) => state.tenantCode || 'PLATFORM');

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    description: string;
    confirmText: string;
    action: () => void;
  } | null>(null);
  const [createForm, setCreateForm] = useState<CategoryCreateForm>(
    DEFAULT_CATEGORY_FORM,
  );
  const [editForm, setEditForm] = useState<CategoryCreateForm>(
    DEFAULT_CATEGORY_FORM,
  );

  const categoriesQuery = useQuery({
    queryKey: ['haccp-base-categories', tenantCode],
    queryFn: () => listHaccpBaseCategories({ tenantCode }),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: createHaccpBaseCategory,
    onSuccess: () => {
      setCreateForm(DEFAULT_CATEGORY_FORM);
      setCreateOpen(false);
      setConfirmState(null);
      showSuccess('분류가 등록되었습니다.');
      void queryClient.invalidateQueries({
        queryKey: ['haccp-base-categories', tenantCode],
      });
    },
    onError: (error) => {
      setConfirmState(null);
      showError(extractApiErrorMessage(error, '분류 등록에 실패했습니다.'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateHaccpBaseCategory,
    onSuccess: () => {
      setEditOpen(false);
      setEditTargetId(null);
      setEditForm(DEFAULT_CATEGORY_FORM);
      setConfirmState(null);
      showSuccess('분류가 수정되었습니다.');
      void queryClient.invalidateQueries({
        queryKey: ['haccp-base-categories', tenantCode],
      });
    },
    onError: (error) => {
      setConfirmState(null);
      showError(extractApiErrorMessage(error, '분류 수정에 실패했습니다.'));
    },
  });

  const sortedRows = useMemo(() => {
    const items = categoriesQuery.data ?? [];
    return [...items]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item, index) => toCategoryRow(item, index));
  }, [categoriesQuery.data]);

  const handleCreate = () => {
    if (!createForm.categoryName.trim()) {
      return;
    }

    setConfirmState({
      title: '분류 등록 확인',
      description: '입력한 분류 정보를 등록하시겠습니까?',
      confirmText: '등록',
      action: () =>
        createMutation.mutate({
          tenantCode,
          categoryCode: createForm.categoryCode.trim(),
          categoryName: createForm.categoryName.trim(),
          sortOrder: createForm.sortOrder,
          active: createForm.useAt === 'Y',
        }),
    });
  };

  const handleOpenEdit = (row: CategoryRow) => {
    setEditTargetId(row.id);
    setEditForm({
      categoryCode: row.categoryCode,
      categoryName: row.categoryName,
      sortOrder: row.sortOrder,
      useAt: row.useAt,
    });
    setEditOpen(true);
  };

  const handleEdit = () => {
    if (!editTargetId || !editForm.categoryName.trim()) {
      return;
    }

    setConfirmState({
      title: '분류 수정 확인',
      description: '수정한 분류 정보를 저장하시겠습니까?',
      confirmText: '저장',
      action: () =>
        updateMutation.mutate({
          tenantCode,
          id: editTargetId,
          categoryName: editForm.categoryName.trim(),
          sortOrder: editForm.sortOrder,
          active: editForm.useAt === 'Y',
        }),
    });
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  const actionIconSx = {
    color: isDarkMode ? '#fbbf24' : '#1f4f8f',
    bgcolor: isDarkMode
      ? 'rgba(251, 191, 36, 0.12)'
      : 'rgba(31, 79, 143, 0.08)',
    '&:hover': {
      bgcolor: isDarkMode
        ? 'rgba(251, 191, 36, 0.2)'
        : 'rgba(31, 79, 143, 0.16)',
    },
  };

  return (
    <Stack spacing={2} data-testid="haccp-base-category-management-page">
      <PageHeader
        groupLabel={APP_LABELS.menu.documentGroup}
        title="업무 분류 관리"
        description="테넌트별 업무 분류를 등록하고 정렬 순서를 관리합니다."
      />

      {categoriesQuery.isError ? (
        <Alert severity="error">
          {extractApiErrorMessage(
            categoriesQuery.error,
            '업무 분류 목록을 불러오지 못했습니다.',
          )}
        </Alert>
      ) : null}

      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackOutlinedIcon />}
          onClick={() => navigate('/docs/haccp-base')}
        >
          양식관리로
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            setCreateForm(DEFAULT_CATEGORY_FORM);
            setCreateOpen(true);
          }}
        >
          + 분류 추가
        </Button>
      </Stack>

      <AdminGrid ariaLabel="업무 분류 목록">
        <TableHead>
          <TableRow>
            <TableCell width={72}>No</TableCell>
            <TableCell width={120}>분류코드</TableCell>
            <TableCell sx={{ minWidth: 360 }}>분류명</TableCell>
            <TableCell width={100}>정렬순서</TableCell>
            <TableCell width={120} align="center">
              등록자
            </TableCell>
            <TableCell width={180} align="center">
              등록일
            </TableCell>
            <TableCell width={90} align="center">
              사용
            </TableCell>
            <TableCell width={90} align="center">
              작업
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {!categoriesQuery.isLoading && sortedRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center">
                조회된 분류가 없습니다.
              </TableCell>
            </TableRow>
          ) : null}

          {sortedRows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>{row.no}</TableCell>
              <TableCell>{row.categoryCode}</TableCell>
              <TableCell>{row.categoryName}</TableCell>
              <TableCell>{row.sortOrder}</TableCell>
              <TableCell align="center">{row.createdBy}</TableCell>
              <TableCell align="center">{row.createdAt}</TableCell>
              <TableCell align="center">
                <Chip
                  size="small"
                  label={row.useAt === 'Y' ? '사용' : '미사용'}
                  color={row.useAt === 'Y' ? 'success' : 'default'}
                />
              </TableCell>
              <TableCell align="center">
                <Stack direction="row" justifyContent="center">
                  <Tooltip title="분류 수정">
                    <IconButton
                      size="small"
                      aria-label="분류 수정"
                      onClick={() => handleOpenEdit(row)}
                      sx={actionIconSx}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </AdminGrid>

      <FormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="분류 추가"
        description="업무 등록 시 선택할 분류를 추가합니다."
        actions={
          <>
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={
                createMutation.isPending || !createForm.categoryName.trim()
              }
            >
              등록
            </Button>
            <Button onClick={() => setCreateOpen(false)}>취소</Button>
          </>
        }
      >
        <Stack spacing={2}>
          <TextField
            label="분류코드"
            value={createForm.categoryCode}
            placeholder="자동 채번됩니다"
            helperText="분류코드는 자동으로 채번됩니다."
            disabled
          />
          <TextField
            label="분류명"
            value={createForm.categoryName}
            onChange={(event) =>
              setCreateForm((prev) => ({
                ...prev,
                categoryName: event.target.value,
              }))
            }
            required
            autoFocus
          />
          <TextField
            label="정렬순서"
            type="number"
            value={createForm.sortOrder}
            onChange={(event) =>
              setCreateForm((prev) => ({
                ...prev,
                sortOrder: Number(event.target.value) || 0,
              }))
            }
            inputProps={{ min: 0 }}
          />
          <TextField
            select
            label="사용여부"
            value={createForm.useAt}
            onChange={(event) =>
              setCreateForm((prev) => ({
                ...prev,
                useAt: event.target.value as 'Y' | 'N',
              }))
            }
          >
            <MenuItem value="Y">사용</MenuItem>
            <MenuItem value="N">미사용</MenuItem>
          </TextField>
        </Stack>
      </FormDialog>

      <FormDialog
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditTargetId(null);
        }}
        title="분류 수정"
        description="분류코드는 변경할 수 없으며, 분류명/정렬순서/사용여부를 수정합니다."
        actions={
          <>
            <Button
              variant="contained"
              onClick={handleEdit}
              disabled={
                updateMutation.isPending || !editForm.categoryName.trim()
              }
            >
              저장
            </Button>
            <Button
              onClick={() => {
                setEditOpen(false);
                setEditTargetId(null);
              }}
            >
              취소
            </Button>
          </>
        }
      >
        <Stack spacing={2}>
          <TextField label="분류코드" value={editForm.categoryCode} disabled />
          <TextField
            label="분류명"
            value={editForm.categoryName}
            onChange={(event) =>
              setEditForm((prev) => ({
                ...prev,
                categoryName: event.target.value,
              }))
            }
            required
            autoFocus
          />
          <TextField
            label="정렬순서"
            type="number"
            value={editForm.sortOrder}
            onChange={(event) =>
              setEditForm((prev) => ({
                ...prev,
                sortOrder: Number(event.target.value) || 0,
              }))
            }
            inputProps={{ min: 0 }}
          />
          <TextField
            select
            label="사용여부"
            value={editForm.useAt}
            onChange={(event) =>
              setEditForm((prev) => ({
                ...prev,
                useAt: event.target.value as 'Y' | 'N',
              }))
            }
          >
            <MenuItem value="Y">사용</MenuItem>
            <MenuItem value="N">미사용</MenuItem>
          </TextField>
        </Stack>
      </FormDialog>

      <ConfirmDialog
        open={confirmState !== null}
        title={confirmState?.title ?? ''}
        description={confirmState?.description ?? ''}
        confirmText={confirmState?.confirmText ?? '확인'}
        confirmColor="primary"
        loading={isMutating}
        onConfirm={() => confirmState?.action()}
        onClose={() => setConfirmState(null)}
      />
    </Stack>
  );
}
