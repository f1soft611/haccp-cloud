import { useState } from 'react';
import {
  Autocomplete,
  Button,
  Stack,
  TextField,
} from '@mui/material';
import { AppTextField } from '../../../../shared/components/forms/AppTextField';
import { FormDialog } from '../../../../shared/components/forms/FormDialog';
import { UserMultiSelectDialog } from '../../../../shared/components/forms/UserMultiSelectDialog';
import type { WorkCycleOption } from '../../../../shared/hooks/useWorkCycleOptions';
import type { UserItem } from '../../../../services/organization/usersService';
import {
  type HaccpCategoryOption,
  type HaccpBaseCreateForm,
} from '../types';
import { AppSelect } from '../../../../shared/components/forms/AppSelect';

const APPROVAL_APPLY_OPTIONS = [
  { value: 'Y', label: '적용' },
  { value: 'N', label: '미적용' },
] as const;

const EXPIRATION_APPLY_OPTIONS = [
  { value: 'Y', label: '해당' },
  { value: 'N', label: '미해당' },
] as const;

const USE_AT_OPTIONS = [
  { value: 'Y', label: '사용' },
  { value: 'N', label: '미사용' },
] as const;

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

    const [assigneeDialogOpen, setAssigneeDialogOpen] = useState(false);
    // 고른 순서대로 이름 표시
    const assigneeNames = value.assigneeIds
        .flatMap((id) => userOptions.find((user) => user.id === id)?.name ?? [])
        .join(', ');
    // 기존 -> 검토자/승인자 항상 필수 / 변경 -> 결재 적용일 때만 필수
    const needsSigners = value.approvalApply === 'Y';
    const isSubmitDisabled =
        !value.cycle ||
        !value.divisionName.trim() ||
        !value.categoryId ||
        (needsSigners && (!value.reviewerId || !value.approverId));

    const findCategoryCode = (categoryId: string) =>
        categoryOptions.find((category) => category.id === categoryId)?.code ?? '';
    // 기존 -> 분류코드로만 판단 / 변경 -> HCP- 분류코드 + 수시 주기일 때만 만료일 관리 표시
    const showExpiration = isExpirationTarget(findCategoryCode(value.categoryId)) && value.cycle === 'ANYTIME';

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={mode === 'create' ? '업무 추가' : '업무 수정'}
      description={
        mode === 'create'
          ? '업무 기본 정보를 등록합니다.'
          : '업무 기본 정보를 수정합니다.'
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
          <AppTextField
            fullWidth
            label="업무코드"
            value={value.divisionCode}
            placeholder="자동 채번됩니다"
            disabled
            helperText="업무코드는 자동으로 채번됩니다."
          />

          <AppTextField
            fullWidth
            label="업무명"
            value={value.divisionName}
            onChange={(divisionName) =>
              onChange({
                ...value,
                divisionName,
              })
            }
            required
            autoFocus={mode === 'create'}
          />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <AppSelect
            fullWidth
            label="분류"
            value={value.categoryId}
              // 기존 -> 분류코드 + 등록주기로 초기화 판단 / 변경 -> HCP- 분류가 아니게 되면 N 으로 초기화
            onChange={(categoryId) =>
                onChange({
                    ...value,
                    categoryId,
                    expirationApply: isExpirationTarget(findCategoryCode(categoryId))
                        ? value.expirationApply
                        : 'N',
                })
            }
            required
            options={categoryOptions.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
          />

          <AppSelect
              fullWidth
              label="작성주기"
              value={value.cycle}
              // 기존 -> 등록주기만 변경 / 변경 -> 수시가 아니면 만료일 관리 N 초기화
              onChange={(cycle) =>
                  onChange({
                      ...value,
                      cycle,
                      expirationApply: cycle === 'ANYTIME' ? value.expirationApply : 'N',
                  })
              }
              required
              helperText={
                cycleOptions.length === 0
                    ? '공통코드 WF_FORM_CYCLE(등록주기)을 먼저 등록하세요.'
                    : undefined
              }
              options={cycleOptions.map((option) => ({
                value: option.code,
                label: option.name,
              }))}
          />
        </Stack>

        {/* 기존 -> Autocomplete multiple 로 이름 검색 후 다중 선택 */}
        {/* 변경 -> 읽기 전용 칸 클릭 시 공용 UserMultiSelectDialog 로 다중 선택 */}
        <AppTextField
          label="담당자"
          value={assigneeNames}
          placeholder="클릭해서 담당자 선택"
          onClick={() => setAssigneeDialogOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              setAssigneeDialogOpen(true);
            }
          }}
          slotProps={{ input: { readOnly: true } }}
          sx={{ '& input': { cursor: 'pointer' } }}
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

              <AppSelect
                  fullWidth
                  label="결재 적용 여부"
                  value={value.approvalApply}
                  onChange={(approvalApply) =>
                      onChange({
                          ...value,
                          approvalApply,
                          reviewerId: approvalApply === 'N' ? '' : value.reviewerId,
                          approverId: approvalApply === 'N' ? '' : value.approverId,
                      })
                  }
                  options={APPROVAL_APPLY_OPTIONS}
              />

              {showExpiration ? (
                  <AppSelect
                      fullWidth
                      label="만료일 관리 양식"
                      value={value.expirationApply}
                      onChange={(expirationApply) => onChange({ ...value, expirationApply })}
                      options={EXPIRATION_APPLY_OPTIONS}
                  />
              ) : null}
          </Stack>

        <AppSelect
          label="사용여부"
          value={value.useAt}
          onChange={(useAt) => onChange({ ...value, useAt })}
          options={USE_AT_OPTIONS}
        />
      </Stack>

      {assigneeDialogOpen ? (
        <UserMultiSelectDialog
          users={userOptions}
          title="담당자 선택"
          selectedUserIds={value.assigneeIds}
          onClose={() => setAssigneeDialogOpen(false)}
          onConfirm={(userIds) => {
            onChange({ ...value, assigneeIds: userIds });
            setAssigneeDialogOpen(false);
          }}
        />
      ) : null}
    </FormDialog>
  );
}
