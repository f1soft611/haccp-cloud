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
import { AppSelect, appSelectPaperSx } from '../../../../shared/components/forms/AppSelect';
import { CommonCodeSelect } from '../../../../shared/components/forms/CommonCodeSelect';
import { COMMON_CODE_GROUP } from '../../../../shared/constants/commonCodeGroups';
import {CancelButton} from "../../../../shared/components/forms/CancelButton.tsx";
import { isMonthlyOrLongerCycle } from '../../../../shared/utils/workCycleDates';
import {
  ANCHOR_TYPE_OPTIONS,
  isWorkStartIncomplete,
  WEEKDAY_ANCHOR_RESET,
  WorkStartDateFields,
} from './WorkStartDateFields';

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

// HCP- 분류 업무는 작성주기 수시, 만료일 관리 해당으로 고정. 수시는 주차 기준을 못 쓰므로 일자 기준으로 되돌린다
export function applyHcpFixedValues(form: HaccpBaseCreateForm, categoryCode: string): HaccpBaseCreateForm {
    if (!isExpirationTarget(categoryCode)) {
        return form;
    }
    return { ...form, ...WEEKDAY_ANCHOR_RESET, cycle: 'ANYTIME', expirationApply: 'Y' };
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
        noticeCountInvalid ||
        isWorkStartIncomplete(value);

    const findCategoryCode = (categoryId: string) =>
        categoryOptions.find((category) => category.id === categoryId)?.code ?? '';
    // HCP- 분류면 작성주기, 만료일 관리 양식을 고정값으로 잠근다
    const isHcpFixed = isExpirationTarget(findCategoryCode(value.categoryId));
    // HCP- 분류코드 + 수시 주기일 때만 만료일 관리 표시
    const showExpiration = isHcpFixed && value.cycle === 'ANYTIME';
    // 월 이상 주기만 주차 기준 선택 가능. 아니면 일자 기준 고정 + 비활성
    const canUseWeekday = isMonthlyOrLongerCycle(value.cycle);

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={mode === 'create' ? '업무 추가' : '업무 수정'}
      // description={
      //   mode === 'create'
      //     ? '업무 기본 정보를 등록합니다.'
      //     : '업무 기본 정보를 수정합니다.'
      // }
      actions={
        <>
          <Button
            onClick={onSubmit}
            variant="contained"
            disabled={isSubmitDisabled}
          >
            {mode === 'create' ? '등록' : '저장'}
          </Button>
          <CancelButton onClick={onClose} />
        </>
      }
    >
      <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <AppSelect
            fullWidth
            label="분류"
            value={value.categoryId}
            onChange={(categoryId) => {
                const categoryCode = findCategoryCode(categoryId);
                const next = { ...value, categoryId };
                // HCP- 면 고정값 덮어쓰기, 아니면 기존처럼 만료일 값 비우기
                onChange(
                    isExpirationTarget(categoryCode)
                        ? applyHcpFixedValues(next, categoryCode)
                        : { ...next, ...EXPIRATION_RESET },
                );
            }}
            required
            options={categoryOptions.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
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
              label="작성주기"
              value={value.cycle}
              onChange={(cycle) =>
                  onChange({
                      ...value,
                      cycle,
                      ...(cycle === 'ANYTIME' ? {} : EXPIRATION_RESET),
                      // 주차 기준은 월 이상 주기만
                      ...(isMonthlyOrLongerCycle(cycle) ? {} : WEEKDAY_ANCHOR_RESET),
                  })
              }
              required
              disabled={isHcpFixed}
              helperText={
                cycleOptions.length === 0
                    ? '공통코드 WF_FORM_CYCLE(등록주기)을 먼저 등록하세요.'
                    : isHcpFixed
                        ? '해당 분류는 작성주기가 수시로 고정됩니다.'
                        : undefined
              }
              options={cycleOptions.map((option) => ({
                value: option.code,
                label: option.name,
              }))}
          />

          <AppSelect
              fullWidth
              label="기준일 방식"
              value={canUseWeekday ? value.cycleAnchorType : 'DATE'}
              onChange={(cycleAnchorType) => onChange({ ...value, cycleAnchorType })}
              disabled={!canUseWeekday}
              options={ANCHOR_TYPE_OPTIONS}
          />
        </Stack>

        <WorkStartDateFields value={value} onChange={onChange} />

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
            slotProps={{ paper: { sx: appSelectPaperSx } }}
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
                data-select-state={value.reviewerId ? 'selected' : 'empty'}
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
            slotProps={{ paper: { sx: appSelectPaperSx } }}
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
                data-select-state={value.approverId ? 'selected' : 'empty'}
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
                      // ponytail: HCP- 분류에서만 보이고 항상 잠겨 있어 선택 변경이 일어나지 않는다
                      onChange={() => undefined}
                      disabled
                      helperText="해당 분류는 만료일 관리로 고정됩니다."
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
