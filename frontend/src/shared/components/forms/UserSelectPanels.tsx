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
    Typography,
} from '@mui/material';
import { AppTextField } from './AppTextField';
import styles from '../sharedComponents.module.css';
import { useSharedScope } from '../useSharedScope';
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
    const scope = useSharedScope();
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

    // 기존 -> sx, 스타일 prop 으로 스타일 지정
    // 변경 -> sharedComponents.module.css 클래스 사용
    return (
        <>
            <AppTextField
                label="이름 검색"
                size="small"
                fullWidth
                value={keyword}
                onChange={setKeyword}
            />
            {loading ? (
                <Box {...scope} className={`${scope.className} ${styles.userPanelsLoading}`}>
                    <CircularProgress size={24} />
                </Box>
            ) : (
                <Box {...scope} className={`${scope.className} ${styles.userPanelsGrid}`}>
                    <List dense aria-label="부서 목록" className={styles.userPanel}>
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
                    <Box className={styles.userPanel}>
                        {renderListHeader?.(visibleUsers.map((user) => user.id))}
                        {visibleUsers.length === 0 ? (
                            <Typography variant="body2" className={`${styles.textSecondary} ${styles.userPanelsEmpty}`}>
                                표시할 사용자가 없습니다.
                            </Typography>
                        ) : (
                            <List dense>
                                {visibleUsers.map((user) => (
                                    <ListItemButton key={user.id} onClick={() => onUserClick(user)}>
                                        <ListItemIcon className={styles.userPanelsControl}>
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