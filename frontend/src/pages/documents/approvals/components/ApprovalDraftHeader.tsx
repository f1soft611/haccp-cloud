import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import { Box, Button, Stack, Typography } from '@mui/material';

type ApprovalDraftHeaderProps = {
  onBack: () => void;
  onApprove?: () => void;
  approveLabel?: string;
  onReject?: () => void;
  onCancelSubmit?: () => void;
  onTempSave?: () => void;
  onSubmitApproval?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  approveDisabled?: boolean;
  rejectDisabled?: boolean;
  cancelSubmitDisabled?: boolean;
  tempSaveDisabled?: boolean;
  submitDisabled?: boolean;
};

export function ApprovalDraftHeader(props: ApprovalDraftHeaderProps) {
  const {
    onBack,
    onApprove,
    approveLabel = '결재 승인',
    onReject,
    onCancelSubmit,
    onTempSave,
    onSubmitApproval,
    submitLabel = '결재 신청',
    isSubmitting = false,
    approveDisabled = true,
    rejectDisabled = true,
    cancelSubmitDisabled = true,
    tempSaveDisabled = false,
    submitDisabled = false,
  } = props;

  return (
    <Box
      sx={{
        pl: 1.5,
        borderLeft: '3px solid',
        borderColor: 'primary.main',
      }}
    >
      <Stack spacing={0.5}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography variant="caption" color="text.secondary">
            문서 관리
          </Typography>
          <Typography variant="caption" color="text.disabled">
            /
          </Typography>
          <Typography variant="caption" color="text.secondary">
            기안서 작성/결재
          </Typography>
        </Stack>

        <Typography component="h1" variant="h5" fontWeight={700}>
          기안서 작성/결재
        </Typography>

        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          justifyContent="space-between"
          spacing={1}
          alignItems={{ xs: 'flex-start', lg: 'flex-end' }}
        >
          <Typography variant="body2" color="text.secondary">
            템플릿 기반 기안을 작성하고, 결재선을 확인한 뒤 참조자와 결재의견을
            남기고 결재를 진행할 수 있습니다.
          </Typography>

          <Stack direction="row" spacing={1}>
            {onApprove ? (
              <Button
                variant="contained"
                color="success"
                disableElevation
                disabled={approveDisabled || isSubmitting}
                onClick={onApprove}
              >
                {approveLabel}
              </Button>
            ) : null}
            {onReject ? (
              <Button
                variant="outlined"
                color="error"
                disableElevation
                disabled={rejectDisabled || isSubmitting}
                onClick={onReject}
              >
                반려
              </Button>
            ) : null}
            {onCancelSubmit ? (
              <Button
                variant="outlined"
                color="error"
                disableElevation
                disabled={cancelSubmitDisabled || isSubmitting}
                onClick={onCancelSubmit}
              >
                결재 취소
              </Button>
            ) : null}
            {onTempSave ? (
              <Button
                variant="contained"
                disableElevation
                disabled={tempSaveDisabled || isSubmitting}
                onClick={onTempSave}
              >
                임시 저장
              </Button>
            ) : null}
            {onSubmitApproval ? (
              <Button
                variant="contained"
                color="warning"
                disableElevation
                disabled={submitDisabled || isSubmitting}
                onClick={onSubmitApproval}
              >
                {submitLabel}
              </Button>
            ) : null}
            <Button
              variant="outlined"
              startIcon={<ArrowBackRounded />}
              onClick={onBack}
            >
              돌아가기
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
