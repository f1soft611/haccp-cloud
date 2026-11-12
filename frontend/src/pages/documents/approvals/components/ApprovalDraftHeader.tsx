import { ArrowLeft } from 'lucide-react';
import { Button, Stack } from '@mui/material';
import { PageHeader } from '../../../../shared/components/layout/PageHeader';
import { APP_LABELS } from '../../../../shared/constants/labels';

type ApprovalDraftHeaderProps = {
  onBack: () => void;
  onApprove?: () => void;
  approveLabel?: string;
  onReject?: () => void;
  onCancelSubmit?: () => void;
  onDelete?: () => void;
  deleteDisabled?: boolean;
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
    onDelete,
    onTempSave,
    onSubmitApproval,
    submitLabel = '결재 신청',
    isSubmitting = false,
    approveDisabled = true,
    rejectDisabled = true,
    cancelSubmitDisabled = true,
    deleteDisabled = false,
    tempSaveDisabled = false,
    submitDisabled = false,
  } = props;

  return (
    <Stack spacing={1.5}>
      <PageHeader
        groupLabel={APP_LABELS.menu.documentGroup}
        title="기안서 작성/결재"
        description="템플릿 기반 기안을 작성하고, 결재선을 확인한 뒤 참조자와 결재의견을 남기고 결재를 진행할 수 있습니다."
        useMenuMetadata={false}
      />

      <Stack
        direction="row"
        spacing={1}
        justifyContent="flex-end"
        flexWrap="wrap"
        useFlexGap
      >
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
            {onDelete ? (
                <Button
                    variant="contained"
                    color="error"
                    disableElevation
                    disabled={deleteDisabled || isSubmitting}
                    onClick={onDelete}
                >
                  삭제
                </Button>
            ) : null}
            {onTempSave ? (
              <Button
                variant="contained"
                disableElevation
                disabled={tempSaveDisabled || isSubmitting}
                onClick={onTempSave}
              >
                저장
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
              startIcon={<ArrowLeft />}
              onClick={onBack}
            >
              돌아가기
            </Button>
      </Stack>
    </Stack>
  );
}
