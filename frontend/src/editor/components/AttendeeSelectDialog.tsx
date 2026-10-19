import { useMemo, useState } from 'react';
import {
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
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

const UNASSIGNED = '미지정';
// 인원 수와 상관없이 dialog 높이 고정: 패널 height 고정 + 패널 내부 스크롤
const PANEL_HEIGHT = { xs: 200, sm: 360 };
const PANEL_SX = { height: PANEL_HEIGHT, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 };
// 로딩 영역 = 패널 영역 전체 높이 (xs는 패널 2개 + gap 8px)
const LOADING_HEIGHT = { xs: PANEL_HEIGHT.xs * 2 + 8, sm: PANEL_HEIGHT.sm };

function toAttendee(user: UserItem): DocumentFieldAttendee {
    return user.signatureImage
        ? { userId: user.id, name: user.name, signatureImage: user.signatureImage }
        : { userId: user.id, name: user.name };
}

function departmentOf(user: UserItem): string {
    return user.department.trim() || UNASSIGNED;
}

export function AttendeeSelectDialog(props: AttendeeSelectDialogProps) {
    const { users, loading = false, selected, onClose, onConfirm } = props;
    const [keyword, setKeyword] = useState('');
    // null = 전체
    const [department, setDepartment] = useState<string | null>(null);
    const [checkedIds, setCheckedIds] = useState<string[]>(() =>
        selected.map((attendee) => attendee.userId),
    );

    const activeUsers = useMemo(() => users.filter((user) => user.active), [users]);

    const departments = useMemo(() => {
        const names = [...new Set(activeUsers.map(departmentOf))];
        return names.sort((a, b) =>
            a === UNASSIGNED ? 1 : b === UNASSIGNED ? -1 : a.localeCompare(b, 'ko'),
        );
    }, [activeUsers]);

    // 기존 -> 활성 사용자를 이름/부서 키워드로 필터링
    // 변경 -> 선택한 부서 + 이름 키워드로 필터링
    const visibleUsers = useMemo(() => {
        const normalized = keyword.trim().toLowerCase();

        return activeUsers.filter(
            (user) =>
                (department === null || departmentOf(user) === department) &&
                (!normalized || user.name.toLowerCase().includes(normalized)),
        );
    }, [activeUsers, department, keyword]);

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

    const visibleIds = visibleUsers.map((user) => user.id);
    const visibleState = checkState(visibleIds);

    return (
        // 기존 -> xs 폭 단일 리스트
        // 변경 -> sm 폭 좌측 부서 / 우측 사용자 2단
        <Dialog open onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>참석자 선택</DialogTitle>
            <DialogContent dividers>
                {/* 기존 -> 이름/부서 검색 */}
                {/* 변경 -> 이름 검색 (부서는 좌측 목록에서 선택) */}
                <TextField
                    label="이름 검색"
                    size="small"
                    fullWidth
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    sx={{ mb: 1 }}
                />
                {/* 기존 -> 로딩 스피너만 표시해 높이가 달라짐 */}
                {/* 변경 -> 패널과 같은 높이 영역 가운데에 스피너 표시 */}
                {loading ? (
                    <Box sx={{ height: LOADING_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : (
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '200px 1fr' },
                            gap: 1,
                        }}
                    >
                        <List dense aria-label="부서 목록" sx={PANEL_SX}>
                            <ListItemButton
                                selected={department === null}
                                onClick={() => setDepartment(null)}
                            >
                                <ListItemText primary={`전체 (${activeUsers.length})`} />
                            </ListItemButton>
                            {departments.map((name) => {
                                const ids = activeUsers
                                .filter((user) => departmentOf(user) === name)
                                .map((user) => user.id);
                                const state = checkState(ids);

                                return (
                                    <ListItemButton
                                        key={name}
                                        selected={department === name}
                                        onClick={() => setDepartment(name)}
                                    >
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
                                    </ListItemButton>
                                );
                            })}
                        </List>
                        <Box sx={PANEL_SX}>
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
                            {visibleUsers.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                    표시할 사용자가 없습니다.
                                </Typography>
                            ) : (
                                <List dense>
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
                        </Box>
                    </Box>
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