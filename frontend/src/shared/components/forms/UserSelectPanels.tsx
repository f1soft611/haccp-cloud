import { useMemo, useState, type ReactNode } from 'react';
import {
    Box,
    Checkbox,
    CircularProgress,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Radio,
    TextField,
    Typography,
} from '@mui/material';
import type { UserItem } from '../../../services/organization/usersService';

type UserSelectPanelsProps = {
    users: UserItem[];
    loading?: boolean;
    isSelected: (userId: string) => boolean;
    onUserClick: (user: UserItem) => void;
    control?: 'checkbox' | 'radio';
    // 부서 행 안의 내용 전체. 없으면 부서 이름만
    renderDepartmentItem?: (name: string, userIds: string[]) => ReactNode;
    // 사용자 목록 맨 위 (전체선택 등)
    renderListHeader?: (visibleUserIds: string[]) => ReactNode;
};

const UNASSIGNED = '미지정';
// 인원 수와 상관없이 dialog 높이 고정: 패널 height 고정 + 패널 내부 스크롤
const PANEL_HEIGHT = { xs: 200, sm: 360 };
const PANEL_SX = { height: PANEL_HEIGHT, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 };
// 로딩 영역 = 패널 영역 전체 높이 (xs는 패널 2개 + gap 8px)
const LOADING_HEIGHT = { xs: PANEL_HEIGHT.xs * 2 + 8, sm: PANEL_HEIGHT.sm };

function departmentOf(user: UserItem): string {
    return user.department.trim() || UNASSIGNED;
}

// 참석자 선택(여러 명), 사원 선택(1명) dialog 공통 화면. 선택 상태는 dialog 가 가진다
export function UserSelectPanels(props: UserSelectPanelsProps) {
    const {
        users,
        loading = false,
        isSelected,
        onUserClick,
        control = 'checkbox',
        renderDepartmentItem,
        renderListHeader,
    } = props;
    const [keyword, setKeyword] = useState('');
    // null = 전체
    const [department, setDepartment] = useState<string | null>(null);

    const activeUsers = useMemo(() => users.filter((user) => user.active), [users]);

    const departments = useMemo(() => {
        const names = [...new Set(activeUsers.map(departmentOf))];
        return names.sort((a, b) =>
            a === UNASSIGNED ? 1 : b === UNASSIGNED ? -1 : a.localeCompare(b, 'ko'),
        );
    }, [activeUsers]);

    // 선택한 부서 + 이름 키워드로 필터링
    const visibleUsers = useMemo(() => {
        const normalized = keyword.trim().toLowerCase();

        return activeUsers.filter(
            (user) =>
                (department === null || departmentOf(user) === department) &&
                (!normalized || user.name.toLowerCase().includes(normalized)),
        );
    }, [activeUsers, department, keyword]);

    const Control = control === 'radio' ? Radio : Checkbox;

    return (
        <>
            <TextField
                label="이름 검색"
                size="small"
                fullWidth
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                sx={{ mb: 1 }}
            />
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
                        {departments.map((name) => (
                            <ListItemButton
                                key={name}
                                selected={department === name}
                                onClick={() => setDepartment(name)}
                            >
                                {renderDepartmentItem ? (
                                    renderDepartmentItem(
                                        name,
                                        activeUsers
                                        .filter((user) => departmentOf(user) === name)
                                        .map((user) => user.id),
                                    )
                                ) : (
                                    <ListItemText primary={name} />
                                )}
                            </ListItemButton>
                        ))}
                    </List>
                    <Box sx={PANEL_SX}>
                        {renderListHeader?.(visibleUsers.map((user) => user.id))}
                        {visibleUsers.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                표시할 사용자가 없습니다.
                            </Typography>
                        ) : (
                            <List dense>
                                {visibleUsers.map((user) => (
                                    <ListItemButton key={user.id} onClick={() => onUserClick(user)}>
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <Control
                                                edge="start"
                                                size="small"
                                                checked={isSelected(user.id)}
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
        </>
    );
}