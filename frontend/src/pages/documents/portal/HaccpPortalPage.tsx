import {
  Alert,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { extractApiErrorMessage } from '../../../services/api/errorMessage';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { APP_LABELS } from '../../../shared/constants/labels';
import { HaccpPortalGrid } from './components/HaccpPortalGrid';
import { useHaccpPortalPage } from './hooks/useHaccpPortalPage';

export function HaccpPortalPage() {
  const { documentsQuery, search, setSearch, onSearch, categoryOptions, rows } =
    useHaccpPortalPage();

  return (
    <Stack spacing={2} data-testid="haccp-portal-page">
      <PageHeader
        groupLabel={APP_LABELS.menu.documentGroup}
        title="HACCP 문서포탈"
        description="관리자용 분류별 문서 목록을 확인합니다."
      />

      {/* 기존 -> 검색필터 없음 / 변경 -> 업무분류·등록주기·키워드 검색필터 */}
      <Paper sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          alignItems={{ xs: 'stretch', md: 'flex-end' }}
        >
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="haccp-portal-category-label">업무분류</InputLabel>
            <Select
              labelId="haccp-portal-category-label"
              value={search.category}
              label="업무분류"
              onChange={(event) =>
                setSearch({ ...search, category: event.target.value })
              }
            >
              <MenuItem value="ALL">전체</MenuItem>
              {categoryOptions.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="haccp-portal-cycle-label">등록주기</InputLabel>
            <Select
              labelId="haccp-portal-cycle-label"
              value={search.cycle}
              label="등록주기"
              onChange={(event) =>
                setSearch({ ...search, cycle: event.target.value })
              }
            >
              <MenuItem value="ALL">전체</MenuItem>
              {APP_LABELS.dashboard.cycles.map((cycle) => (
                <MenuItem key={cycle} value={cycle}>
                  {cycle}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="구분명, 담당자 검색"
            value={search.keyword}
            onChange={(event) =>
              setSearch({ ...search, keyword: event.target.value })
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') onSearch();
            }}
            sx={{ flex: 1, minWidth: 260 }}
          />

          <Button variant="contained" onClick={onSearch}>
            조회
          </Button>
        </Stack>
      </Paper>

      {documentsQuery.isError ? (
        <Alert severity="error">
          {extractApiErrorMessage(
            documentsQuery.error,
            'HACCP 문서포탈 목록을 불러오지 못했습니다.',
          )}
        </Alert>
      ) : null}

      <HaccpPortalGrid rows={rows} loading={documentsQuery.isLoading} />
    </Stack>
  );
}
