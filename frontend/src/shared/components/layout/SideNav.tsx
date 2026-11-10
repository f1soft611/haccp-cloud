import { useMemo, useState } from 'react';
import {
    Box,
    Collapse,
    Drawer,
    Link,
    List,
    ListItemButton,
    ListItemText,
    Typography,
    useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import { Link as RouterLink, NavLink, useLocation } from 'react-router-dom';
import type { UserRole } from '../../store/authStore';
import type { MenuGroup } from './workMenuConfig';
import { prefetchRouteByPath } from '../../../app/router/routePrefetch';
import { APP_LABELS } from '../../constants/labels';
import { loadLastLoginTenantNo } from '../../utils/loginDomainRouting';
import styles from '../sharedComponents.module.css';
import { useSharedScope } from '../useSharedScope';

type TenantBrandCache = {
    tenantNm?: string;
    logoImage?: string;
};

function resolveTenantBrandStorageKey(tenantNo: string): string {
    return `haccp.tenant-brand.${tenantNo}`;
}

function resolveSafeLogoSrc(logoImage?: string): string {
    const value = (logoImage ?? '').trim();
    if (!value) {
        return '';
    }

    if (value.startsWith('data:image/')) {
        return value;
    }

    if (value.startsWith('https://')) {
        return value;
    }

    if (value.startsWith('http://')) {
        return import.meta.env.PROD ? '' : value;
    }

    if (/^[a-z0-9+/=\r\n]+$/i.test(value) && value.length >= 32) {
        const compact = value.replace(/\s+/g, '');
        return `data:image/png;base64,${compact}`;
    }

    return '';
}

function loadTenantBrand(): { logoSrc: string; logoAlt: string } {
    if (typeof window === 'undefined') {
        return { logoSrc: '', logoAlt: '업체 로고' };
    }

    const tenantNo = loadLastLoginTenantNo();
    if (!tenantNo) {
        return { logoSrc: '', logoAlt: '업체 로고' };
    }

    try {
        const raw = window.sessionStorage.getItem(
            resolveTenantBrandStorageKey(tenantNo),
        );
        if (!raw) {
            return { logoSrc: '', logoAlt: '업체 로고' };
        }

        const parsed = JSON.parse(raw) as TenantBrandCache;
        const tenantName = (parsed.tenantNm ?? '').trim();
        return {
            logoSrc: resolveSafeLogoSrc(parsed.logoImage),
            logoAlt: tenantName ? `${tenantName} 로고` : '업체 로고',
        };
    } catch {
        return { logoSrc: '', logoAlt: '업체 로고' };
    }
}

function isPathActive(pathname: string, path: string): boolean {
    return pathname === path || pathname.startsWith(`${path}/`);
}

type SideNavProps = {
    menuGroups: MenuGroup[];
    role: UserRole;
    mobileOpen: boolean;
    onMobileClose: () => void;
};

// 권한에 맞는 메뉴 그룹을 왼쪽 메뉴바로 표시한다.
export function SideNav({
                            menuGroups,
                            role,
                            mobileOpen,
                            onMobileClose,
                        }: SideNavProps) {
    const theme = useTheme();
    const scope = useSharedScope();
    // jsdom 처럼 matchMedia 가 없는 환경에서는 데스크톱(permanent)으로 렌더링한다.
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'), {
        noSsr: true,
        defaultMatches: true,
    });
    const location = useLocation();
    const tenantBrand = loadTenantBrand();

    const visibleGroups = useMemo(
        () =>
            menuGroups
            .filter((group) => group.roles.includes(role))
            .map((group) => ({
                ...group,
                items: group.items.filter((item) => item.roles.includes(role)),
            }))
            .filter((group) => group.items.length > 0),
        [menuGroups, role],
    );

    const activeGroupKey = visibleGroups.find((group) =>
        group.items.some((item) => isPathActive(location.pathname, item.path)),
    )?.key;

    const [openGroupKeys, setOpenGroupKeys] = useState<Set<string>>(
        () => new Set(activeGroupKey ? [activeGroupKey] : []),
    );
    const [lastActiveGroupKey, setLastActiveGroupKey] = useState(activeGroupKey);

    // 경로가 바뀌어 현재 그룹이 달라지면 그 그룹을 펼친다(열려 있던 다른 그룹은 유지).
    if (activeGroupKey !== lastActiveGroupKey) {
        setLastActiveGroupKey(activeGroupKey);
        if (activeGroupKey && !openGroupKeys.has(activeGroupKey)) {
            setOpenGroupKeys(new Set(openGroupKeys).add(activeGroupKey));
        }
    }

    const toggleGroup = (groupKey: string) => {
        setOpenGroupKeys((current) => {
            const next = new Set(current);
            if (next.has(groupKey)) {
                next.delete(groupKey);
            } else {
                next.add(groupKey);
            }
            return next;
        });
    };

    // 기존 -> sx, 스타일 prop 으로 스타일 지정
    // 변경 -> sharedComponents.module.css 클래스 사용
    const content = (
        <Box
            component="nav"
            data-testid="side-nav"
            aria-label="주 메뉴"
            className={styles.sideNavRoot}
        >
            <Box className={styles.sideNavBrand}>
                <Link
                    component={RouterLink}
                    to="/"
                    underline="none"
                    color="inherit"
                    aria-label={`${APP_LABELS.appTitle} ${APP_LABELS.appSubtitle} 홈으로 이동`}
                    className={styles.sideNavBrandLink}
                >
                    {tenantBrand.logoSrc ? (
                        <Box
                            component="img"
                            src={tenantBrand.logoSrc}
                            alt={tenantBrand.logoAlt}
                            className={styles.sideNavLogo}
                        />
                    ) : (
                        <Typography variant="subtitle1" className={styles.sideNavBrandText}>
                            업체 포털
                        </Typography>
                    )}
                </Link>
            </Box>

            <List disablePadding className={styles.sideNavList}>
                {visibleGroups.map((group) => {
                    if (group.isSingleMenu) {
                        const item = group.items[0];
                        const isActive = isPathActive(location.pathname, item.path);

                        return (
                            <Box key={group.key} className={styles.sideNavGroup}>
                                <ListItemButton
                                    component={NavLink}
                                    to={item.path}
                                    onClick={isDesktop ? undefined : onMobileClose}
                                    onMouseEnter={() => {
                                        void prefetchRouteByPath(item.path);
                                    }}
                                    onFocus={() => {
                                        void prefetchRouteByPath(item.path);
                                    }}
                                    className={`${styles.sideNavItem} ${styles.sideNavLink}`}
                                    data-active={isActive}
                                >
                                    <ListItemText
                                        primary={item.label}
                                        slotProps={{ primary: { className: styles.sideNavText } }}
                                    />
                                </ListItemButton>
                            </Box>
                        );
                    }

                    const isOpen = openGroupKeys.has(group.key);

                    return (
                        <Box key={group.key} className={styles.sideNavGroup}>
                            <ListItemButton
                                onClick={() => toggleGroup(group.key)}
                                aria-expanded={isOpen}
                                className={styles.sideNavItem}
                                data-active={group.key === activeGroupKey}
                            >
                                <ListItemText
                                    primary={group.label}
                                    slotProps={{ primary: { className: styles.sideNavText } }}
                                />
                                {isOpen ? (
                                    <ChevronUp size={20} />
                                ) : (
                                    <ChevronDown size={20} />
                                )}
                            </ListItemButton>

                            <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                <List disablePadding className={styles.sideNavSubList}>
                                    {group.items.map((item) => {
                                        const isActive = isPathActive(location.pathname, item.path);

                                        return (
                                            <ListItemButton
                                                key={item.path}
                                                component={NavLink}
                                                to={item.path}
                                                onClick={isDesktop ? undefined : onMobileClose}
                                                onMouseEnter={() => {
                                                    void prefetchRouteByPath(item.path);
                                                }}
                                                onFocus={() => {
                                                    void prefetchRouteByPath(item.path);
                                                }}
                                                className={styles.sideNavSubItem}
                                                data-active={isActive}
                                            >
                                                <ChevronRight size={20} className={styles.sideNavChevron} />
                                                <ListItemText
                                                    primary={item.label}
                                                    slotProps={{ primary: { className: styles.sideNavSubText } }}
                                                />
                                            </ListItemButton>
                                        );
                                    })}
                                </List>
                            </Collapse>
                        </Box>
                    );
                })}
            </List>
        </Box>
    );

    return (
        <Drawer
            {...scope}
            className={`${scope.className} ${styles.sideNavDrawer}`}
            data-desktop={isDesktop}
            variant={isDesktop ? 'permanent' : 'temporary'}
            open={isDesktop || mobileOpen}
            onClose={onMobileClose}
        >
            {content}
        </Drawer>
    );
}