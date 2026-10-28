import { useState } from 'react';
import {
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    ListItemIcon,
    ListItemText,
    Typography,
} from '@mui/material';
import type { UserItem } from '../../../services/organization/usersService';
import { UserSelectPanels } from './UserSelectPanels';

type UserMultiSelectDialogProps = {
    users: UserItem[];
    loading?: boolean;
    title: string;
    // 열 때 체크돼 있을 사용자
    selectedUserIds: string[];
    onClose: () => void;
    // 체크한 순서대로
    onConfirm: (userIds: string[]) => void;
};

// 여러 명 선택. 부모가 열 때만 마운트해야 초기 선택값이 매번 다시 잡힌다
export function UserMultiSelectDialog(props: UserMultiSelectDialogProps) {
    const { users, loading = false, title, selectedUserIds, onClose, onConfirm } = props;
    const [checkedIds, setCheckedIds] = useState<string[]>(selectedUserIds);

    const toggle = (userId: string) => {
        setCheckedIds((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId],
        );
    };

    // 모두 선택돼 있으면 전부 해제, 아니면 빠진 사람만 뒤에 추가
    const toggleMany = (ids: string[]) => {
        setCheckedIds((prev) =>
            ids.every((id) => prev.includes(id))
                ? prev.filter((id) => !ids.includes(id))
                : [...prev, ...ids.filter((id) => !prev.includes(id))],
        );
    };

    const checkState = (ids: string[]) => {
        const count = ids.filter((id) => checkedIds.includes(id)).length;
        return {
            count,
            checked: ids.length > 0 && count === ids.length,
            indeterminate: count > 0 && count < ids.length,
        };
    };

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{title}</DialogTitle>
            <DialogContent dividers>
                <UserSelectPanels
                    users={users}
                    loading={loading}
                    isSelected={(userId) => checkedIds.includes(userId)}
                    onUserClick={(user) => toggle(user.id)}
                    renderDepartmentItem={(name, ids) => {
                        const state = checkState(ids);

                        return (
                            <>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                    <Checkbox
                                        edge="start"
                                        size="small"
                                        checked={state.checked}
                                        indeterminate={state.indeterminate}
                                        onClick={(event) => event.stopPropagation()}
                                        onChange={() => toggleMany(ids)}
                                        slotProps={{ input: { 'aria-label': `${name} 부서 선택` } }}
                                    />
                                </ListItemIcon>
                                <ListItemText primary={name} />
                                <Typography variant="caption" color="text.secondary">
                                    ({state.count}/{ids.length})
                                </Typography>
                            </>
                        );
                    }}
                    renderListHeader={(visibleIds) => {
                        const visibleState = checkState(visibleIds);

                        return (
                            <FormControlLabel
                                sx={{ px: 2, py: 0.5 }}
                                control={
                                    <Checkbox
                                        size="small"
                                        checked={visibleState.checked}
                                        indeterminate={visibleState.indeterminate}
                                        disabled={visibleIds.length === 0}
                                        onChange={() => toggleMany(visibleIds)}
                                    />
                                }
                                label={`전체선택 (${visibleState.count}/${visibleIds.length})`}
                            />
                        );
                    }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>취소</Button>
                <Button variant="contained" onClick={() => onConfirm(checkedIds)}>
                    확인 ({checkedIds.length}명)
                </Button>
            </DialogActions>
        </Dialog>
    );
}
