import type { UserItem } from '../../../../services/organization/usersService';
import { ConfirmDialog } from '../../../../shared/components/feedback/ConfirmDialog';

type UserPasswordResetDialogProps = {
    open: boolean;
    target: UserItem | null;
    saving?: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

export function UserPasswordResetDialog({
                                            open,
                                            target,
                                            saving,
                                            onClose,
                                            onConfirm,
                                        }: UserPasswordResetDialogProps) {
    return (
        <ConfirmDialog
            open={open}
            title="비밀번호 초기화"
            description={
                target
                    ? `${target.name} 사용자의 비밀번호를 초기화하시겠습니까? 임시 비밀번호는 로그인 아이디를 반복한 값으로 설정됩니다.`
                    : '비밀번호를 초기화하시겠습니까?'
            }
            confirmText="초기화"
            confirmColor="warning"
            loading={saving}
            onClose={onClose}
            onConfirm={onConfirm}
        />
    );
}