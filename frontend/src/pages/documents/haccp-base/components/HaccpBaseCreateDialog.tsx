import {
  Autocomplete,
  Button,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { FormDialog } from '../../../../shared/components/forms/FormDialog';
import type { UserItem } from '../../../../services/organization/usersService';
import {
  HACCP_CYCLE_OPTIONS,
  type HaccpCategoryOption,
  type HaccpBaseCreateForm,
} from '../types';

export function HaccpBaseCreateDialog(props: {
  open: boolean;
  mode: 'create' | 'edit';
  categoryOptions: HaccpCategoryOption[];
  userOptions: UserItem[];
  value: HaccpBaseCreateForm;
  onClose: () => void;
  onChange: (next: HaccpBaseCreateForm) => void;
  onSubmit: () => void;
}) {
  const {
    open,
    mode,
    categoryOptions,
    userOptions,
    value,
    onClose,
    onChange,
    onSubmit,
  } = props;

  const isSubmitDisabled =
    !value.divisionName.trim() ||
    !value.categoryId ||
    !value.reviewerId ||
    !value.approverId;

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={mode === 'create' ? '업무 추가' : '업무 수정'}
      description={
        mode === 'create'
          ? '양식 기본 정보를 등록합니다.'
          : '양식 기본 정보를 수정합니다.'
      }
      actions={
        <>
          <Button
            onClick={onSubmit}
            variant="contained"
            disabled={isSubmitDisabled}
          >
            {mode === 'create' ? '등록' : '저장'}
          </Button>
          <Button onClick={onClose}>취소</Button>
        </>
      }
    >
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            fullWidth
            label="구분코드"
            value={value.divisionCode}
            onChange={(event) =>
              onChange({
                ...value,
                divisionCode: event.target.value,
              })
            }
            inputProps={{ maxLength: 3 }}
            required={false}
            autoFocus={mode === 'create'}
            disabled={mode === 'edit'}
            helperText={
              mode === 'edit'
                ? '구분코드는 수정할 수 없습니다.'
                : '미입력 시 자동 발급됩니다.'
            }
          />

          <TextField
            fullWidth
            label="구분명"
            value={value.divisionName}
            onChange={(event) =>
              onChange({
                ...value,
                divisionName: event.target.value,
              })
            }
            required
          />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            fullWidth
            select
            label="분류"
            value={value.categoryId}
            onChange={(event) =>
              onChange({
                ...value,
                categoryId: event.target.value,
              })
            }
            required
          >
            {categoryOptions.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            select
            label="등록주기"
            value={value.cycle}
            onChange={(event) =>
              onChange({
                ...value,
                cycle: event.target.value as HaccpBaseCreateForm['cycle'],
              })
            }
          >
            {HACCP_CYCLE_OPTIONS.map((cycle) => (
              <MenuItem key={cycle} value={cycle}>
                {cycle}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Autocomplete
          multiple
          options={userOptions}
          value={userOptions.filter((user) =>
            value.assigneeIds.includes(user.id),
          )}
          onChange={(_, selected) =>
            onChange({
              ...value,
              assigneeIds: selected.map((user) => user.id),
            })
          }
          openOnFocus={false}
          forcePopupIcon={false}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, selected) => option.id === selected.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label="담당자"
              placeholder="이름으로 검색 후 다중 선택"
              // helperText="UI 시안 단계입니다. 저장 연동은 담당자 매핑 규격 확정 후 적용됩니다."
            />
          )}
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Autocomplete
            fullWidth
            options={userOptions}
            value={
              userOptions.find((user) => user.id === value.reviewerId) ?? null
            }
            onChange={(_, selected) =>
              onChange({
                ...value,
                reviewerId: selected?.id ?? '',
              })
            }
            openOnFocus={false}
            forcePopupIcon={false}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, selected) =>
              option.id === selected.id
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="검토자"
                placeholder="이름으로 검색"
                required
              />
            )}
          />

          <Autocomplete
            fullWidth
            options={userOptions}
            value={
              userOptions.find((user) => user.id === value.approverId) ?? null
            }
            onChange={(_, selected) =>
              onChange({
                ...value,
                approverId: selected?.id ?? '',
              })
            }
            openOnFocus={false}
            forcePopupIcon={false}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, selected) =>
              option.id === selected.id
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="승인자"
                placeholder="이름으로 검색"
                required
              />
            )}
          />
        </Stack>

        <TextField
          select
          label="사용여부"
          value={value.useAt}
          onChange={(event) =>
            onChange({
              ...value,
              useAt: event.target.value as 'Y' | 'N',
            })
          }
        >
          <MenuItem value="Y">사용</MenuItem>
          <MenuItem value="N">미사용</MenuItem>
        </TextField>
      </Stack>
    </FormDialog>
  );
}
