import { useMemo, useState } from 'react';
import {
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    TextField,
    Typography,
} from '@mui/material';
import type { UserItem } from '../../services/organization/usersService';
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
    const [keyword, setKeyword] = useState('');
    const [checkedIds, setCheckedIds] = useState<string[]>(() =>
        selected.map((attendee) => attendee.userId),
    );

    const visibleUsers = useMemo(() => {
        const normalized = keyword.trim().toLowerCase();

        return users.filter(
            (user) =>
                user.active &&
                (!normalized ||
                    user.name.toLowerCase().includes(normalized) ||
                    user.department.toLowerCase().includes(normalized)),
        );
    }, [users, keyword]);

    const toggle = (userId: string) => {
        setCheckedIds((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId],
        );
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
        <Dialog open onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>참석자 선택</DialogTitle>
            <DialogContent dividers>
                <TextField
                    label="이름/부서 검색"
                    size="small"
                    fullWidth
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    sx={{ mb: 1 }}
                />
                {loading ? (
                    <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} />
                ) : visibleUsers.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                        표시할 사용자가 없습니다.
                    </Typography>
                ) : (
                    <List dense sx={{ maxHeight: 360, overflowY: 'auto' }}>
                        {visibleUsers.map((user) => (
                            <ListItemButton key={user.id} onClick={() => toggle(user.id)}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                    <Checkbox
                                        edge="start"
                                        size="small"
                                        checked={checkedIds.includes(user.id)}
                                        tabIndex={-1}
                                        disableRipple
                                    />
                                </ListItemIcon>
                                <ListItemText primary={user.name} secondary={user.department || '-'} />
                            </ListItemButton>
                        ))}
                    </List>
                )}
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