import {
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  Button,
} from '@mui/material';
import { AppTextField } from '../../../../shared/components/forms/AppTextField';
import { useEffect, useState } from 'react';
import { FormDialog } from '../../../../shared/components/forms/FormDialog';
import {
  formatBusinessNo,
  formatJuridNo,
  toDigitsOnly,
} from '../../../../shared/utils/businessNumberFormat';
import {CancelButton} from "../../../../shared/components/forms/CancelButton.tsx";

export type CustomerFormValue = {
  customerName: string;
  custNameAbbr: string;
  presidentName: string;
  /** 숫자만(하이픈 없음) */
  businessNo: string;
  /** 숫자만(하이픈 없음) */
  juridNo: string;
  businessStatus1: string;
  businessItem1: string;
  postCode: string;
  address: string;
  telephoneNo: string;
  facsimileNo: string;
  custMemo: string;
  active: boolean;
};

type CustomerFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialValue?: CustomerFormValue;
  customerCode?: string;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (value: CustomerFormValue) => void;
};

const EMPTY_VALUE: CustomerFormValue = {
  customerName: '',
  custNameAbbr: '',
  presidentName: '',
  businessNo: '',
  juridNo: '',
  businessStatus1: '',
  businessItem1: '',
  postCode: '',
  address: '',
  telephoneNo: '',
  facsimileNo: '',
  custMemo: '',
  active: true,
};

export function CustomerFormDialog({
  open,
  mode,
  initialValue,
  customerCode,
  saving,
  onClose,
  onSubmit,
}: CustomerFormDialogProps) {
  const [value, setValue] = useState<CustomerFormValue>(EMPTY_VALUE);
  const [businessNoError, setBusinessNoError] = useState(false);
  const [juridNoError, setJuridNoError] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setValue(initialValue ?? EMPTY_VALUE);
    setBusinessNoError(false);
    setJuridNoError(false);
  }, [open, initialValue]);

  const handleSubmit = () => {
    const businessNoInvalid =
      value.businessNo.length > 0 && value.businessNo.length !== 10;
    const juridNoInvalid = value.juridNo.length > 0 && value.juridNo.length !== 13;

    if (businessNoInvalid) {
      setBusinessNoError(true);
      return;
    }
    if (juridNoInvalid) {
      setJuridNoError(true);
      return;
    }

    onSubmit({
      ...value,
      customerName: value.customerName.trim(),
      custNameAbbr: value.custNameAbbr.trim(),
      presidentName: value.presidentName.trim(),
      businessStatus1: value.businessStatus1.trim(),
      businessItem1: value.businessItem1.trim(),
      postCode: value.postCode.trim(),
      address: value.address.trim(),
      telephoneNo: value.telephoneNo.trim(),
      facsimileNo: value.facsimileNo.trim(),
      custMemo: value.custMemo.trim(),
    });
  };

  const disabled = saving || value.customerName.trim().length === 0;

  return (
    <FormDialog
      open={open}
      title={mode === 'create' ? '거래처 등록' : '거래처 수정'}
      description={
        mode === 'create'
          ? '거래처 정보를 입력해 등록합니다. 거래처코드는 저장 시 자동으로 채번됩니다.'
          : '거래처 정보를 수정하고 저장하세요.'
      }
      onClose={onClose}
      maxWidth="md"
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
            <Grid size={{ xs: 12, sm: 4 }}>
              <AppTextField
                label="거래처코드"
                value={customerCode ?? ''}
                fullWidth
                disabled
              />
            </Grid>
          ) : null}
          <Grid size={{ xs: 12, sm: mode === 'edit' ? 8 : 12 }}>
            <AppTextField
              label="거래처명 *"
              value={value.customerName}
              onChange={(customerName) =>
                setValue((prev) => ({ ...prev, customerName }))
              }
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <AppTextField
              label="거래처약어명"
              value={value.custNameAbbr}
              onChange={(custNameAbbr) =>
                setValue((prev) => ({ ...prev, custNameAbbr }))
              }
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <AppTextField
              label="대표자명"
              value={value.presidentName}
              onChange={(presidentName) =>
                setValue((prev) => ({ ...prev, presidentName }))
              }
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <AppTextField
              label="사업자번호"
              placeholder="000-00-00000"
              value={formatBusinessNo(value.businessNo)}
              error={businessNoError}
              helperText={businessNoError ? '사업자번호는 숫자 10자리입니다.' : ' '}
              onChange={(nextValue) => {
                setValue((prev) => ({
                  ...prev,
                  businessNo: toDigitsOnly(nextValue).slice(0, 10),
                }));
                setBusinessNoError(false);
              }}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <AppTextField
              label="법인번호"
              placeholder="000000-0000000"
              value={formatJuridNo(value.juridNo)}
              error={juridNoError}
              helperText={juridNoError ? '법인번호는 숫자 13자리입니다.' : ' '}
              onChange={(nextValue) => {
                setValue((prev) => ({
                  ...prev,
                  juridNo: toDigitsOnly(nextValue).slice(0, 13),
                }));
                setJuridNoError(false);
              }}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <AppTextField
              label="업태"
              value={value.businessStatus1}
              onChange={(businessStatus1) =>
                setValue((prev) => ({
                  ...prev,
                  businessStatus1,
                }))
              }
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <AppTextField
              label="종목"
              value={value.businessItem1}
              onChange={(businessItem1) =>
                setValue((prev) => ({ ...prev, businessItem1 }))
              }
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <AppTextField
              label="우편번호"
              value={value.postCode}
              onChange={(postCode) =>
                setValue((prev) => ({ ...prev, postCode }))
              }
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <AppTextField
              label="주소"
              value={value.address}
              onChange={(address) =>
                setValue((prev) => ({ ...prev, address }))
              }
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <AppTextField
              label="전화번호"
              value={value.telephoneNo}
              onChange={(telephoneNo) =>
                setValue((prev) => ({ ...prev, telephoneNo }))
              }
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <AppTextField
              label="팩스번호"
              value={value.facsimileNo}
              onChange={(facsimileNo) =>
                setValue((prev) => ({ ...prev, facsimileNo }))
              }
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <AppTextField
              label="비고"
              value={value.custMemo}
              onChange={(custMemo) =>
                setValue((prev) => ({ ...prev, custMemo }))
              }
              fullWidth
              multiline
              rows={2}
            />
          </Grid>
        </Grid>

        <FormControlLabel
          control={
            <Switch
              checked={value.active}
              onChange={(event) =>
                setValue((prev) => ({
                  ...prev,
                  active: event.target.checked,
                }))
              }
            />
          }
          label={value.active ? '사용' : '미사용'}
        />
      </Stack>
    </FormDialog>
  );
}
