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
import type { UserItem } from '../../services/organization/usersService';
import { UserSelectPanels } from '../../shared/components/forms/UserSelectPanels';
import type { DocumentFieldAttendee } from '../utils/documentFieldAttendees';

type AttendeeSelectDialogProps = {
    users: UserItem[];
    loading?: boolean;
    selected: DocumentFieldAttendee[];
    onClose: () => void;
    onConfirm: (attendees: DocumentFieldAttendee[]) => void;
};

function toAttendee(user: UserItem): DocumentFieldAttendee {
    return user.signatureImage
        ? { userId: user.id, name: user.name, signatureImage: user.signatureImage }
        : { userId: user.id, name: user.name };
}

export function AttendeeSelectDialog(props: AttendeeSelectDialogProps) {
    const { users, loading = false, selected, onClose, onConfirm } = props;
    const [checkedIds, setCheckedIds] = useState<string[]>(() =>
        selected.map((attendee) => attendee.userId),
    );

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

    const handleConfirm = () => {
        const attendees = checkedIds.flatMap((userId) => {
            const existing = selected.find((attendee) => attendee.userId === userId);
            if (existing) {
                return [existing];
            }

            const user = users.find((item) => item.id === userId);
            return user ? [toAttendee(user)] : [];
        });

        onConfirm(attendees);
    };

    return (
        // 기존 -> xs 폭 단일 리스트
        // 변경 -> sm 폭 좌측 부서 / 우측 사용자 2단
        <Dialog open onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>참석자 선택</DialogTitle>
            <DialogContent dividers>
                {/* 기존 -> 검색, 부서 목록, 사용자 목록을 이 파일에서 직접 렌더 */}
                {/* 변경 -> 공통 UserSelectPanels 사용 (사원 선택 dialog 와 공유) */}
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
                <Button variant="contained" onClick={handleConfirm}>
                    확인 ({checkedIds.length}명)
                </Button>
            </DialogActions>
        </Dialog>
    );
}