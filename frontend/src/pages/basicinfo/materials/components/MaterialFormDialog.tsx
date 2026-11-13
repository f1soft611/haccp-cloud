import { Button, Grid, Stack } from '@mui/material';
import { AppTextField } from '../../../../shared/components/forms/AppTextField';
import { useEffect, useState } from 'react';
import { FormDialog } from '../../../../shared/components/forms/FormDialog';
import { CommonCodeSelect } from '../../../../shared/components/forms/CommonCodeSelect';
import { COMMON_CODE_GROUP } from '../../../../shared/constants/commonCodeGroups';
import { CancelButton } from "../../../../shared/components/forms/CancelButton";

export type MaterialFormValue = {
  materialName: string;
  itemType: string;
  materialSpec: string;
  materialWeight: string;
  unit: string;
  materialKind: string;
  storeMethod: string;
  expiryedStatus: string;
  expiryedCount: string;
  kfdaReportNo: string;
  etc: string;
};

type MaterialFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialValue?: MaterialFormValue;
  materialCode?: string;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (value: MaterialFormValue) => void;
};

const EMPTY_VALUE: MaterialFormValue = {
  materialName: '',
  itemType: '',
  materialSpec: '',
  materialWeight: '',
  unit: '',
  materialKind: '',
  storeMethod: '',
  expiryedStatus: 'NONE',
  expiryedCount: '',
  kfdaReportNo: '',
  etc: '',
};

export function MaterialFormDialog({
                                     open,
                                     mode,
                                     initialValue,
                                     materialCode,
                                     saving,
                                     onClose,
                                     onSubmit,
                                   }: MaterialFormDialogProps) {
  const [value, setValue] = useState<MaterialFormValue>(EMPTY_VALUE);

  useEffect(() => {
    if (!open) {
      return;
    }
    setValue(initialValue ?? EMPTY_VALUE);
  }, [open, initialValue]);

  const handleSubmit = () => {
    onSubmit({
      ...value,
      materialName: value.materialName.trim(),
      materialSpec: value.materialSpec.trim(),
      unit: value.unit.trim(),
      kfdaReportNo: value.kfdaReportNo.trim(),
      etc: value.etc.trim(),
    });
  };

  // 소비기한 기준이 '없음'이 아니면 계산숫자(1 이상 정수) 필수
  const usesExpiryCount = value.expiryedStatus !== 'NONE';
  const expiryCountInvalid =
      usesExpiryCount && !/^[1-9]\d*$/.test(value.expiryedCount);

  const disabled =
      saving || value.materialName.trim().length === 0 || expiryCountInvalid;

  return (
      <FormDialog
          open={open}
          title={mode === 'create' ? '품목 등록' : '품목 수정'}
          description={
            mode === 'create'
                ? '품목 정보를 입력해 등록합니다. 품목코드는 저장 시 자동으로 채번됩니다.'
                : '품목 정보를 수정하고 저장하세요.'
          }
          onClose={onClose}
          maxWidth="sm"
          actions={
            <>
              <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={disabled}
              >
                저장
              </Button>
              <CancelButton onClick={onClose} disabled={saving} />
            </>
          }
      >
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Grid container spacing={2}>
            {mode === 'edit' ? (
                <Grid size={{ xs: 12, sm: 5 }}>
                  <AppTextField
                      label="품목코드"
                      value={materialCode ?? ''}
                      fullWidth
                      disabled
                  />
                </Grid>
            ) : null}
            <Grid size={{ xs: 12, sm: mode === 'edit' ? 7 : 12 }}>
              <AppTextField
                  label="품목명 *"
                  value={value.materialName}
                  onChange={(materialName) =>
                      setValue((prev) => ({ ...prev, materialName }))
                  }
                  fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CommonCodeSelect
                  groupCode={COMMON_CODE_GROUP.ITEM_TYPE}
                  label="품목계정"
                  value={value.itemType}
                  onChange={(itemType) => setValue((prev) => ({ ...prev, itemType }))}
                  fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CommonCodeSelect
                  groupCode={COMMON_CODE_GROUP.MATERIAL_TYPE}
                  label="품목유형구분"
                  value={value.materialKind}
                  onChange={(materialKind) => setValue((prev) => ({ ...prev, materialKind }))}
                  fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <AppTextField
                  label="규격"
                  value={value.materialSpec}
                  onChange={(materialSpec) =>
                      setValue((prev) => ({ ...prev, materialSpec }))
                  }
                  fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <AppTextField
                  label="중량"
                  type="number"
                  value={value.materialWeight}
                  onChange={(materialWeight) =>
                      setValue((prev) => ({
                        ...prev,
                        materialWeight,
                      }))
                  }
                  fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              {/* 기존 -> 단위 자유 입력 TextField / 변경 -> 공통코드 ITEM_UNIT 셀렉트(코드 저장) */}
              <CommonCodeSelect
                  groupCode={COMMON_CODE_GROUP.ITEM_UNIT}
                  label="단위"
                  value={value.unit}
                  onChange={(unit) => setValue((prev) => ({ ...prev, unit }))}
                  fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CommonCodeSelect
                  groupCode={COMMON_CODE_GROUP.STORE_METHOD}
                  label="보관방법"
                  value={value.storeMethod}
                  onChange={(storeMethod) => setValue((prev) => ({ ...prev, storeMethod }))}
                  fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CommonCodeSelect
                  groupCode={COMMON_CODE_GROUP.EXPIRY_STATUS}
                  label="소비기한 기준"
                  value={value.expiryedStatus}
                  allowEmpty={false}
                  onChange={(expiryedStatus) =>
                      setValue((prev) => ({
                        ...prev,
                        expiryedStatus,
                        expiryedCount: expiryedStatus === 'NONE' ? '' : prev.expiryedCount,
                      }))
                  }
                  fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <AppTextField
                  label={usesExpiryCount ? '소비기한 계산숫자 *' : '소비기한 계산숫자'}
                  type="number"
                  value={value.expiryedCount}
                  onChange={(expiryedCount) =>
                      setValue((prev) => ({ ...prev, expiryedCount }))
                  }
                  disabled={!usesExpiryCount}
                  error={expiryCountInvalid}
                  helperText={expiryCountInvalid ? '1 이상의 정수를 입력하세요.' : undefined}
                  slotProps={{ htmlInput: { min: 1, step: 1 } }}
                  fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <AppTextField
                  label="품목보고번호"
                  value={value.kfdaReportNo}
                  onChange={(kfdaReportNo) =>
                      setValue((prev) => ({ ...prev, kfdaReportNo }))
                  }
                  slotProps={{ htmlInput: { maxLength: 20 } }}
                  fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <AppTextField
                  label="비고"
                  value={value.etc}
                  onChange={(etc) =>
                      setValue((prev) => ({ ...prev, etc }))
                  }
                  fullWidth
                  multiline
                  rows={2}
              />
            </Grid>
          </Grid>
        </Stack>
      </FormDialog>
  );
}