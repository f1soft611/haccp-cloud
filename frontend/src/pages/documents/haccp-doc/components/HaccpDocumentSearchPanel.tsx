import {
  Checkbox,
  ListItemText,
  MenuItem,
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
import type { HaccpDocSearchValue } from '../types';
import { TODO_STATUS_OPTIONS } from '../../../dashboard/tenant/todoFilter';

const STATUS_OPTIONS = [...TODO_STATUS_OPTIONS];
const PARTICIPANT_OPTIONS = ['담당자', '기안자', '검토자', '결재자'];

export function HaccpDocumentSearchPanel(props: {
  value: HaccpDocSearchValue;
  appliedFilters: HaccpDocSearchValue;
  canViewAllDocuments: boolean;
  categoryOptions: Array<{ id: string; name: string }>;
  divisionOptions: Array<{ id: string; name: string }>;
  onChange: (next: HaccpDocSearchValue) => void;
  onReset: () => void;
  onSearch: () => void;
}) {
  const {
    value,
    categoryOptions,
    divisionOptions,
    onChange,
    onReset,
    onSearch,
  } = props;

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
    >
      <AppSelect
        size="small"
        label="업무분류"
        value={value.workType}
        onChange={(workType) => onChange({ ...value, workType })}
        options={workTypeOptions.map((cat) => ({ value: cat.name, label: cat.name }))}
        emptyLabel="전체"
        sx={{ minWidth: 140 }}
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

      <AppDateField
        size="small"
        label="기안일"
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
        label="~"
        value={value.endDate}
        onChange={(endDate) =>
          onChange({
            ...value,
            endDate,
          })
        }
      />

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
        placeholder="제목, 기안번호, 작성자 검색"
        slotProps={{ htmlInput: { 'aria-label': '제목, 기안번호, 작성자 검색' } }}
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
