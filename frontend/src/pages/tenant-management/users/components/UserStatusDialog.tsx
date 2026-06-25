import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import type { UserItem } from '../../../../services/common/usersService';

type UserStatusDialogProps = {
  open: boolean;
  target: UserItem | null;
  saving?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function UserStatusDialog({
  open,
  target,
  saving,
  onClose,
  onConfirm,
}: UserStatusDialogProps) {
  const nextAction = target?.active ? '로그인 차단' : '차단 해제';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>사용자 상태 변경</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {target
            ? `${target.name} 사용자를 ${nextAction} 하시겠습니까?`
            : '상태를 변경하시겠습니까?'}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          취소
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={saving || !target}
        >
          확인
        </Button>
      </DialogActions>
    </Dialog>
  );
}
