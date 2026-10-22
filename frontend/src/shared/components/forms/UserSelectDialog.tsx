import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import type { UserItem } from '../../../services/organization/usersService';
import { UserSelectPanels } from './UserSelectPanels';

type UserSelectDialogProps = {
    users: UserItem[];
    loading?: boolean;
    title: string;
    // 열 때 선택돼 있을 사용자, 없으면 빈 문자열
    selectedUserId: string;
    onClose: () => void;
    onConfirm: (user: UserItem) => void;
};

// 1명 선택. 부모가 열 때만 마운트해야 초기 선택값이 매번 다시 잡힌다
export function UserSelectDialog(props: UserSelectDialogProps) {
    const { users, loading = false, title, selectedUserId, onClose, onConfirm } = props;
    const [checkedId, setCheckedId] = useState(selectedUserId);
    const checkedUser = users.find((user) => user.id === checkedId);

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{title}</DialogTitle>
            <DialogContent dividers>
                <UserSelectPanels
                    users={users}
                    loading={loading}
                    control="radio"
                    isSelected={(userId) => userId === checkedId}
                    onUserClick={(user) => setCheckedId(user.id)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>취소</Button>
                <Button
                    variant="contained"
                    disabled={!checkedUser}
                    onClick={() => checkedUser && onConfirm(checkedUser)}
                >
                    확인
                </Button>
            </DialogActions>
        </Dialog>
    );
}