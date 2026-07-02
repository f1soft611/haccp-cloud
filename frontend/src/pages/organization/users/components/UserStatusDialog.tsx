import type { UserItem } from '../../../../services/organization/usersService';
import { ConfirmDialog } from '../../../../shared/components/feedback/ConfirmDialog';

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
    <ConfirmDialog
      open={open}
      title="사용자 상태 변경"
      description={
        target
          ? `${target.name} 사용자를 ${nextAction} 하시겠습니까?`
          : '상태를 변경하시겠습니까?'
      }
      confirmText="확인"
      confirmColor={target?.active ? 'warning' : 'primary'}
      loading={saving}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
