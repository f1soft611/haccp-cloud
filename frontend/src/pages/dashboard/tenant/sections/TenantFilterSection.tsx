import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined';
import {
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useWorkCycleOptions } from '../../../../shared/hooks/useWorkCycleOptions';
import {
  TODO_STATUS_OPTIONS,
  type TenantTodoFilter,
  type TenantViewMode,
} from '../todoFilter';

type TenantFilterSectionProps = {
  value: TenantTodoFilter;
  categoryOptions: string[];
  viewMode: TenantViewMode;
  onChange: (value: TenantTodoFilter) => void;
  onReset: () => void;
  onSearch: () => void;
  onViewModeChange: (viewMode: TenantViewMode) => void;
};

// 다른 화면 검색필터(HaccpDocumentSearchPanel 등)와 같은 레이아웃: 조건 + 초기화/조회 버튼
export function TenantFilterSection(props: TenantFilterSectionProps) {
  const {
    value,
    categoryOptions,
    viewMode,
    onChange,
    onReset,
    onSearch,
    onViewModeChange,
  } = props;

  const cycleOptions = useWorkCycleOptions();

  const selectField = (
    key: 'category' | 'status',
    label: string,
    options: readonly string[],
    minWidth: number,
  ) => (
    <TextField
      select
      size="small"
      label={label}
      value={value[key]}
      onChange={(event) => onChange({ ...value, [key]: event.target.value })}
      sx={{ minWidth }}
      slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
    >
      <MenuItem value="">전체</MenuItem>
      {options.map((option) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        {/* 기존 -> 조회 버튼 아랫줄 오른쪽 / 변경 -> 검색조건 윗줄 오른쪽: 리스트형/캘린더형 전환 */}
        <Stack direction="row" justifyContent="flex-end">
          <ToggleButtonGroup
            size="small"
            exclusive
            value={viewMode}
            onChange={(_, next: TenantViewMode | null) => {
              if (next) {
                onViewModeChange(next);
              }
            }}
            aria-label="보기 형식"
          >
            <ToggleButton value="list" aria-label="리스트형">
              <ViewListOutlinedIcon fontSize="small" sx={{ mr: 0.5 }} />
              리스트
            </ToggleButton>
            <ToggleButton value="calendar" aria-label="캘린더형">
              <CalendarMonthOutlinedIcon fontSize="small" sx={{ mr: 0.5 }} />
              캘린더
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          alignItems={{ xs: 'stretch', md: 'flex-end' }}
        >
          {selectField('category', '업무분류', categoryOptions, 140)}
          <TextField
              select
              size="small"
              label="주기"
              value={value.cycle}
              onChange={(event) => onChange({ ...value, cycle: event.target.value })}
              sx={{ minWidth: 120 }}
              slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">전체(수시제외)</MenuItem>
            {cycleOptions.map((option) => (
                <MenuItem key={option.code} value={option.code}>
                  {option.name}
                </MenuItem>
            ))}
          </TextField>
          {selectField('status', '상태', TODO_STATUS_OPTIONS, 140)}

          <TextField
            size="small"
            label="업무명"
            value={value.keyword}
            onChange={(event) =>
              onChange({ ...value, keyword: event.target.value })
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onSearch();
              }
            }}
            sx={{ flex: 1, minWidth: 160 }}
          />

          <Stack
            direction="row"
            spacing={1}
            sx={{ flexShrink: 0, '& .MuiButton-root': { whiteSpace: 'nowrap' } }}
          >
            <Button variant="outlined" onClick={onReset}>
              초기화
            </Button>
            <Button variant="contained" onClick={onSearch}>
              조회
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
