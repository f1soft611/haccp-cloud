import {
  Autocomplete,
  Button,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { FormDialog } from '../../../../shared/components/forms/FormDialog';
import type { WorkCycleOption } from '../../../../shared/hooks/useWorkCycleOptions';
import type { UserItem } from '../../../../services/organization/usersService';
import {
  type HaccpCategoryOption,
  type HaccpBaseCreateForm,
} from '../types';

// 분류코드 HCP-XXX 이면 대상
function isExpirationTarget(categoryCode: string) {
    return categoryCode.startsWith('HCP-');
}

export function HaccpBaseCreateDialog(props: {
  open: boolean;
  mode: 'create' | 'edit';
  categoryOptions: HaccpCategoryOption[];
  userOptions: UserItem[];
  value: HaccpBaseCreateForm;
  onClose: () => void;
  onChange: (next: HaccpBaseCreateForm) => void;
  onSubmit: () => void;
  cycleOptions: WorkCycleOption[];
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
    cycleOptions,
  } = props;

    // 기존 -> 검토자/승인자 항상 필수 / 변경 -> 결재 적용일 때만 필수
    const needsSigners = value.approvalApply === 'Y';
    const isSubmitDisabled =
        !value.cycle ||
        !value.divisionName.trim() ||
        !value.categoryId ||
        (needsSigners && (!value.reviewerId || !value.approverId));

    const findCategoryCode = (categoryId: string) =>
        categoryOptions.find((category) => category.id === categoryId)?.code ?? '';
    // 기존 -> 분류코드 + 등록주기로 판단 / 변경 -> 분류코드로만 판단
    const showExpiration = isExpirationTarget(findCategoryCode(value.categoryId));

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
            placeholder="자동 채번됩니다"
            disabled
            helperText="구분코드는 자동으로 채번됩니다."
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
            autoFocus={mode === 'create'}
          />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            fullWidth
            select
            label="분류"
            value={value.categoryId}
              // 기존 -> 분류코드 + 등록주기로 초기화 판단 / 변경 -> HCP- 분류가 아니게 되면 N 으로 초기화
            onChange={(event) =>
                onChange({
                    ...value,
                    categoryId: event.target.value,
                    expirationApply: isExpirationTarget(findCategoryCode(event.target.value))
                        ? value.expirationApply
                        : 'N',
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
              // 기존 -> 수시가 아니면 만료일 관리 양식 N 초기화 / 변경 -> 등록주기만 변경 (만료일은 분류로만 판단)
              onChange={(event) =>
                  onChange({
                      ...value,
                      cycle: event.target.value,
                  })
              }
              required
              helperText={
                cycleOptions.length === 0
                    ? '공통코드 WF_FORM_CYCLE(등록주기)을 먼저 등록하세요.'
                    : undefined
              }
          >
            {cycleOptions.map((option) => (
                <MenuItem key={option.code} value={option.code}>
                  {option.name}
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
            disabled={!needsSigners}    // 결재 미적용이면 검토자 선택 불가
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
                required={needsSigners} // 기존 -> required / 변경 -> 결재 적용일 때만 필수
              />
            )}
          />

          <Autocomplete
            fullWidth
            disabled={!needsSigners}    // 결재 미적용이면 검토자 선택 불가
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
                required={needsSigners} // 기존 -> required / 변경 -> 결재 적용일 때만 필수
              />
            )}
          />
        </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>

              <TextField
                  fullWidth
                  select
                  label="결재 적용 여부"
                  value={value.approvalApply}
                  onChange={(event) => {
                      const approvalApply = event.target.value as 'Y' | 'N';
                      onChange({
                          ...value,
                          approvalApply,
                          reviewerId: approvalApply === 'N' ? '' : value.reviewerId,
                          approverId: approvalApply === 'N' ? '' : value.approverId,
                      });
                  }}
              >
                  <MenuItem value="Y">적용</MenuItem>
                  <MenuItem value="N">미적용</MenuItem>
              </TextField>

              {showExpiration ? (
                  <TextField
                      fullWidth
                      select
                      label="만료일 관리 양식"
                      value={value.expirationApply}
                      onChange={(event) =>
                          onChange({
                              ...value,
                              expirationApply: event.target.value as 'Y' | 'N',
                          })
                      }
                  >
                      <MenuItem value="Y">해당</MenuItem>
                      <MenuItem value="N">미해당</MenuItem>
                  </TextField>
              ) : null}
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
