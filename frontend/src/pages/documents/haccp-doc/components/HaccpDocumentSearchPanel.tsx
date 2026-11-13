import { SlidersHorizontal } from 'lucide-react';
import {
  Button,
  Chip,
  Collapse,
  Divider,
  Checkbox,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { AppDateField } from '../../../../shared/components/forms/AppDateField';
import { AppTextField } from '../../../../shared/components/forms/AppTextField';
import {
  AppSelect,
  AppSelectIcon,
  appSelectMenuProps,
  SelectAllLabel,
  SelectAllValue,
} from '../../../../shared/components/forms/AppSelect';
import { SearchFilterBar } from '../../../../shared/components/forms/SearchFilterBar';
import type { HaccpDocFilterChip, HaccpDocSearchValue } from '../types';
import { TODO_STATUS_OPTIONS } from '../../../dashboard/tenant/todoFilter';

const STATUS_OPTIONS = [...TODO_STATUS_OPTIONS];
const PARTICIPANT_OPTIONS = ['담당자', '기안자', '검토자', '결재자'];

export function HaccpDocumentSearchPanel(props: {
  value: HaccpDocSearchValue;
  appliedFilters: HaccpDocSearchValue;
  canViewAllDocuments: boolean;
  detailOpen: boolean;
  activeFilterChips: HaccpDocFilterChip[];
  categoryOptions: Array<{ id: string; name: string }>;
  divisionOptions: Array<{ id: string; name: string }>;
  onChange: (next: HaccpDocSearchValue) => void;
  onToggleDetail: () => void;
  onReset: () => void;
  onSearch: () => void;
}) {
  const {
    value,
    detailOpen,
    activeFilterChips,
    categoryOptions,
    divisionOptions,
    onChange,
    onToggleDetail,
    onReset,
    onSearch,
  } = props;

  // 기존 -> value.workType && value.workType !== '전체' && ...
  // 변경 -> '' = 전체라 앞의 value.workType 검사로 충분
  const workTypeOptions =
    value.workType &&
    !categoryOptions.some((option) => option.name === value.workType)
      ? [
          { id: `selected-${value.workType}`, name: value.workType },
          ...categoryOptions,
        ]
      : categoryOptions;

  const workDivisionOptions =
    value.workDivision &&
    !divisionOptions.some(
      (option) =>
        option.id === value.workDivision || option.name === value.workDivision,
    )
      ? [
          {
            id: `selected-${value.workDivision}`,
            name: value.workDivision,
          },
          ...divisionOptions,
        ]
      : divisionOptions;

  return (
    <SearchFilterBar
      onSearch={onSearch}
      onReset={onReset}
      detail={
        <>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1}
            alignItems={{ xs: 'stretch', md: 'center' }}
            justifyContent="space-between"
          >
            <Button
              variant="text"
              /* 기존 -> MUI 아이콘 / 변경 -> lucide 아이콘 */
              startIcon={<SlidersHorizontal />}
              onClick={onToggleDetail}
              sx={{
                width: { xs: '100%', md: 'auto' },
                alignSelf: 'flex-start',
              }}
            >
              {detailOpen ? '상세조건 닫기' : '상세조건'}
            </Button>

            {activeFilterChips.length > 0 ? (
              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                useFlexGap
                flexWrap="wrap"
              >
                {activeFilterChips.map((chip) => (
                  <Chip
                    key={chip.key}
                    size="small"
                    label={chip.label}
                    variant="outlined"
                  />
                ))}
              </Stack>
            ) : null}
          </Stack>

          <Collapse in={detailOpen} timeout="auto" unmountOnExit={false}>
            <Stack spacing={1.2}>
              <Divider />
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1}
                useFlexGap
                flexWrap="wrap"
                alignItems={{ xs: 'stretch', md: 'flex-end' }}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <AppDateField
                    size="small"
                    label="기안일 시작"
                    value={value.startDate}
                    onChange={(startDate) =>
                      onChange({
                        ...value,
                        startDate,
                      })
                    }
                  />
                  <AppDateField
                    size="small"
                    label="기안일 종료"
                    value={value.endDate}
                    onChange={(endDate) =>
                      onChange({
                        ...value,
                        endDate,
                      })
                    }
                  />
                </Stack>

                <TextField
                  select
                  size="small"
                  data-select-state={value.participantType.length === 0 ? 'empty' : 'selected'}
                  label={
                    value.participantType.length === 0 ? (
                      <SelectAllLabel label="참여유형" />
                    ) : (
                      '참여유형'
                    )
                  }
                  value={value.participantType}
                  InputLabelProps={
                    value.participantType.length === 0 ? { shrink: false } : undefined
                  }
                  SelectProps={{
                    multiple: true,
                    displayEmpty: true,
                    notched: value.participantType.length > 0,
                    MenuProps: appSelectMenuProps,
                    IconComponent: AppSelectIcon,
                    renderValue: (selected) =>
                      Array.isArray(selected) && selected.length > 0
                        ? selected.join(', ')
                        : <SelectAllValue />,
                  }}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      participantType:
                        typeof event.target.value === 'string'
                          ? event.target.value
                              .split(',')
                              .map((item) => item.trim())
                              .filter((item) => item.length > 0)
                          : event.target.value,
                    })
                  }
                  sx={{ minWidth: 160 }}
                >
                  {PARTICIPANT_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      <Checkbox
                        checked={value.participantType.includes(option)}
                      />
                      <ListItemText primary={option} />
                    </MenuItem>
                  ))}
                </TextField>

                <AppTextField
                  size="small"
                  label="작성자"
                  value={value.writer}
                  onChange={(writer) =>
                    onChange({
                      ...value,
                      writer,
                    })
                  }
                  sx={{ minWidth: 160 }}
                />
              </Stack>
            </Stack>
          </Collapse>
        </>
      }
    >
      <AppSelect
        size="small"
        label="업무분류"
        value={value.workType}
        onChange={(workType) => onChange({ ...value, workType })}
        options={workTypeOptions.map((cat) => ({ value: cat.name, label: cat.name }))}
        emptyLabel="전체"
        sx={{ minWidth: 180 }}
      />

      <AppSelect
        size="small"
        label="업무구분"
        value={value.workDivision}
        onChange={(workDivision) => onChange({ ...value, workDivision })}
        options={workDivisionOptions.map((division) => ({
          value: division.id,
          label: division.name,
        }))}
        emptyLabel="전체"
        sx={{ minWidth: 220 }}
      />

      <AppSelect
        size="small"
        label="결재상태"
        value={value.status}
        onChange={(status) => onChange({ ...value, status })}
        options={STATUS_OPTIONS.map((option) => ({ value: option, label: option }))}
        emptyLabel="전체"
        sx={{ minWidth: 140 }}
      />

      <AppTextField
        size="small"
        placeholder="제목, 기안번호 검색"
        slotProps={{ htmlInput: { 'aria-label': '제목, 기안번호 검색' } }}
        value={value.title}
        onChange={(title) =>
          onChange({
            ...value,
            title,
          })
        }
        sx={{ flex: 1, minWidth: 220 }}
      />
    </SearchFilterBar>
  );
}
