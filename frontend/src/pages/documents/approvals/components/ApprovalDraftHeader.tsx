import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import { Box, Button, Stack, Typography } from '@mui/material';

type ApprovalDraftHeaderProps = {
  onBack: () => void;
  onCancelSubmit?: () => void;
  onTempSave: () => void;
  onSubmitApproval: () => void;
  isSubmitting?: boolean;
  cancelSubmitDisabled?: boolean;
  tempSaveDisabled?: boolean;
  submitDisabled?: boolean;
};

export function ApprovalDraftHeader(props: ApprovalDraftHeaderProps) {
  const {
    onBack,
    onCancelSubmit,
    onTempSave,
    onSubmitApproval,
    isSubmitting = false,
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
            기안서 작성
          </Typography>
        </Stack>

        <Typography component="h1" variant="h5" fontWeight={700}>
          기안서 작성
        </Typography>

        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          justifyContent="space-between"
          spacing={1}
          alignItems={{ xs: 'flex-start', lg: 'flex-end' }}
        >
          <Typography variant="body2" color="text.secondary">
            템플릿 기반 기안을 작성하고, 결재선을 확인한 뒤 참조자와 결재의견을
            등록합니다.
          </Typography>

          <Stack direction="row" spacing={1}>
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
            <Button
              variant="contained"
              disableElevation
              disabled={tempSaveDisabled || isSubmitting}
              onClick={onTempSave}
            >
              임시 저장
            </Button>
            <Button
              variant="contained"
              color="warning"
              disableElevation
              disabled={submitDisabled || isSubmitting}
              onClick={onSubmitApproval}
            >
              결재 신청
            </Button>
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
