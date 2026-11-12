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
import { CommonCodeSelect } from '../../../../shared/components/forms/CommonCodeSelect';
import { COMMON_CODE_GROUP } from '../../../../shared/constants/commonCodeGroups';

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

// 만료일 관리 양식이 미해당이 될 때 함께 비우는 값
const EXPIRATION_RESET = {
  expirationApply: 'N',
  expirationNoticeStatus: 'NONE',
  expirationNoticeCount: '',
} as const;

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

    // 만료일 관리 해당 + 안내 기준이 없음이 아니면 계산숫자(1 이상 정수) 필수
    const usesNoticeCount =
        value.expirationApply === 'Y' && value.expirationNoticeStatus !== 'NONE';
    const noticeCountInvalid =
        usesNoticeCount && !/^[1-9]\d*$/.test(value.expirationNoticeCount);
    // 기존 -> 작성주기, 업무명, 분류, 결재자만 판단 / 변경 -> 만료일 안내 계산숫자 오류도 판단
    const isSubmitDisabled =
        !value.cycle ||
        !value.divisionName.trim() ||
        !value.categoryId ||
        (needsSigners && (!value.reviewerId || !value.approverId)) ||
        noticeCountInvalid;

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
            onChange={(categoryId) =>
                onChange({
                    ...value,
                    categoryId,
                    ...(isExpirationTarget(findCategoryCode(categoryId)) ? {} : EXPIRATION_RESET),
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
              onChange={(cycle) =>
                  onChange({
                      ...value,
                      cycle,
                      ...(cycle === 'ANYTIME' ? {} : EXPIRATION_RESET),
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
                      onChange={(expirationApply) =>
                          onChange({ ...value, ...EXPIRATION_RESET, expirationApply })
                      }
                      options={EXPIRATION_APPLY_OPTIONS}
                  />
              ) : null}
          </Stack>

        {showExpiration && value.expirationApply === 'Y' ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <CommonCodeSelect
                  groupCode={COMMON_CODE_GROUP.EXPIRY_STATUS}
                  label="만료일 안내 기준"
                  value={value.expirationNoticeStatus}
                  allowEmpty={false}
                  onChange={(expirationNoticeStatus) =>
                      onChange({
                        ...value,
                        expirationNoticeStatus,
                        expirationNoticeCount:
                            expirationNoticeStatus === 'NONE' ? '' : value.expirationNoticeCount,
                      })
                  }
                  fullWidth
              />
              <AppTextField
                  label={usesNoticeCount ? '만료일 안내 계산숫자 *' : '만료일 안내 계산숫자'}
                  type="number"
                  value={value.expirationNoticeCount}
                  onChange={(expirationNoticeCount) => onChange({ ...value, expirationNoticeCount })}
                  disabled={!usesNoticeCount}
                  error={noticeCountInvalid}
                  helperText={
                    noticeCountInvalid
                        ? '1 이상의 정수를 입력하세요.'
                        : '만료일 기준 며칠 전에 안내할지 입력합니다.'
                  }
                  slotProps={{ htmlInput: { min: 1, step: 1 } }}
                  fullWidth
              />
            </Stack>
        ) : null}

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
