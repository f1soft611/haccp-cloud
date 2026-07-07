import { Stack } from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { APP_LABELS } from '../../../shared/constants/labels';
import { HaccpBaseCreateDialog } from './components/HaccpBaseCreateDialog';
import { HaccpBaseGrid } from './components/HaccpBaseGrid';
import {
  HaccpBaseSearchBar,
  type HaccpBaseSearchValue,
} from './components/HaccpBaseSearchBar';
import type { HaccpBaseCreateForm, HaccpBaseRow } from './types';

const DEFAULT_SEARCH_VALUE: HaccpBaseSearchValue = {
  category: '전체',
  keyword: '',
};

const DEFAULT_CREATE_FORM: HaccpBaseCreateForm = {
  divisionCode: '',
  divisionName: '',
  category: 'HACCP문서(HA)',
  cycle: '일',
};

const DEFAULT_ROWS: HaccpBaseRow[] = [
  {
    id: '1',
    no: 1,
    divisionCode: '0001',
    divisionName: 'CCP-1B(Aw측정)복합조미식품·품질',
    category: 'HACCP문서(HA)',
    cycle: '일',
    createdBy: '고대성',
    createdAt: '2025-12-15 14:23',
    owner: '금도연',
  },
  {
    id: '2',
    no: 2,
    divisionCode: '0002',
    divisionName: '중요관리점 검증점검표(CCP-B)',
    category: 'HACCP문서(HA)',
    cycle: '월',
    createdBy: '고대성',
    createdAt: '2025-12-15 17:43',
    owner: '금도연',
  },
  {
    id: '3',
    no: 3,
    divisionCode: '0003',
    divisionName: '중요관리점 검증점검표(CCP-P)',
    category: 'HACCP문서(HA)',
    cycle: '월',
    createdBy: '고대성',
    createdAt: '2025-12-15 17:39',
    owner: '금도연',
  },
  {
    id: '4',
    no: 4,
    divisionCode: '001',
    divisionName: '기안서',
    category: '일반',
    cycle: '발생시',
    createdBy: '관리자',
    createdAt: '2025-06-25 07:32',
    owner: '관리자',
  },
];

export function HaccpBaseManagementPage() {
  const navigate = useNavigate();

  const [searchValue, setSearchValue] =
    useState<HaccpBaseSearchValue>(DEFAULT_SEARCH_VALUE);
  const [appliedFilters, setAppliedFilters] =
    useState<HaccpBaseSearchValue>(DEFAULT_SEARCH_VALUE);
  const [rows, setRows] = useState<HaccpBaseRow[]>(DEFAULT_ROWS);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] =
    useState<HaccpBaseCreateForm>(DEFAULT_CREATE_FORM);

  const filteredRows = useMemo(() => {
    const keyword = appliedFilters.keyword.trim().toLowerCase();

    return rows.filter((row) => {
      const byCategory =
        appliedFilters.category === '전체' ||
        row.category === appliedFilters.category;

      if (!byCategory) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return (
        row.divisionName.toLowerCase().includes(keyword) ||
        row.owner.toLowerCase().includes(keyword)
      );
    });
  }, [appliedFilters, rows]);

  const handleCreate = () => {
    const nextNo = rows.length + 1;
    const now = new Date();
    const createdAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate(),
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes(),
    ).padStart(2, '0')}`;

    setRows((prev) => [
      {
        id: String(nextNo),
        no: nextNo,
        divisionCode: createForm.divisionCode.trim(),
        divisionName: createForm.divisionName.trim(),
        category: createForm.category,
        cycle: createForm.cycle,
        createdBy: '현재사용자',
        createdAt,
        owner: '-',
      },
      ...prev,
    ]);

    setCreateForm(DEFAULT_CREATE_FORM);
    setCreateOpen(false);
  };

  return (
    <Stack spacing={2} data-testid="haccp-base-management-page">
      <PageHeader
        groupLabel={APP_LABELS.menu.documentGroup}
        title="HACCP 양식관리"
        description="양식 기준정보를 조회하고 담당자/문서 편집 화면으로 이동해 상세 작업을 진행합니다."
      />

      <HaccpBaseSearchBar
        value={searchValue}
        onChange={setSearchValue}
        onSearch={() => {
          setAppliedFilters({
            ...searchValue,
            keyword: searchValue.keyword.trim(),
          });
        }}
        onCreate={() => {
          setCreateForm(DEFAULT_CREATE_FORM);
          setCreateOpen(true);
        }}
        onCategorySettings={() => navigate('/docs/haccp-base/categories')}
      />

      <HaccpBaseGrid
        rows={filteredRows}
        onOpenAssigneePage={(rowId) =>
          navigate(`/docs/haccp-base/assignees/${rowId}`)
        }
        onOpenEditorPage={(rowId) =>
          navigate(`/docs/haccp-base/editor/${rowId}`)
        }
      />

      <HaccpBaseCreateDialog
        open={createOpen}
        value={createForm}
        onChange={setCreateForm}
        onSubmit={handleCreate}
        onClose={() => setCreateOpen(false)}
      />
    </Stack>
  );
}
