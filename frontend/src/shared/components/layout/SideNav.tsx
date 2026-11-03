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
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { Link as RouterLink, NavLink, useLocation } from 'react-router-dom';
import type { UserRole } from '../../store/authStore';
import type { MenuGroup } from './workMenuConfig';
import { prefetchRouteByPath } from '../../../app/router/routePrefetch';
import { APP_LABELS } from '../../constants/labels';
import { loadLastLoginTenantNo } from '../../utils/loginDomainRouting';

export const SIDE_NAV_WIDTH = 240;

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

export function SideNav({
                            menuGroups,
                            role,
                            mobileOpen,
                            onMobileClose,
                        }: SideNavProps) {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
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

    const accentColor = isDarkMode ? '#fef3c7' : theme.palette.primary.main;
    const dividerColor = isDarkMode ? 'rgba(251,191,36,0.16)' : 'divider';

    const content = (
        <Box
            component="nav"
            data-testid="side-nav"
            aria-label="주 메뉴"
            sx={{
                height: '100%',
                overflowY: 'auto',
                bgcolor: isDarkMode ? '#111827' : 'common.white',
                color: isDarkMode ? '#f8fafc' : 'text.primary',
            }}
        >
            <Box sx={{ px: 3, py: 3.5 }}>
                <Link
                    component={RouterLink}
                    to="/"
                    underline="none"
                    color="inherit"
                    aria-label={`${APP_LABELS.appTitle} ${APP_LABELS.appSubtitle} 홈으로 이동`}
                    sx={{
                        display: 'inline-block',
                        borderRadius: 1,
                        '&:focus-visible': {
                            outline: isDarkMode ? '2px solid #fbbf24' : '2px solid #0f766e',
                            outlineOffset: '2px',
                        },
                    }}
                >
                    {tenantBrand.logoSrc ? (
                        <Box
                            component="img"
                            src={tenantBrand.logoSrc}
                            alt={tenantBrand.logoAlt}
                            sx={{
                                display: 'block',
                                maxWidth: 163,
                                height: 28,
                                objectFit: 'contain',
                                imageRendering: '-webkit-optimize-contrast',
                            }}
                        />
                    ) : (
                        <Typography variant="subtitle1" fontWeight={800}>
                            업체 포털
                        </Typography>
                    )}
                </Link>
            </Box>

            <List disablePadding sx={{ borderTop: '1px solid', borderColor: dividerColor }}>
                {visibleGroups.map((group) => {
                    const isOpen = openGroupKeys.has(group.key);

                    return (
                        <Box
                            key={group.key}
                            sx={{ borderBottom: '1px solid', borderColor: dividerColor }}
                        >
                            <ListItemButton
                                onClick={() => toggleGroup(group.key)}
                                aria-expanded={isOpen}
                                sx={{ px: 3, py: 1.5 }}
                            >
                                <ListItemText
                                    primary={group.label}
                                    slotProps={{
                                        primary: {
                                            fontSize: '0.9375rem',
                                            fontWeight: group.key === activeGroupKey ? 700 : 500,
                                        },
                                    }}
                                />
                                {isOpen ? (
                                    <ExpandLessRoundedIcon fontSize="small" />
                                ) : (
                                    <ExpandMoreRoundedIcon fontSize="small" />
                                )}
                            </ListItemButton>

                            <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                <List disablePadding sx={{ pb: 1 }}>
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
                                                sx={{
                                                    pl: 3,
                                                    pr: 2,
                                                    py: 0.75,
                                                    color: isActive ? accentColor : 'text.secondary',
                                                }}
                                            >
                                                <ChevronRightRoundedIcon
                                                    fontSize="small"
                                                    sx={{ mr: 0.5, visibility: isActive ? 'visible' : 'hidden' }}
                                                />
                                                <ListItemText
                                                    primary={item.label}
                                                    slotProps={{
                                                        primary: {
                                                            fontSize: '0.875rem',
                                                            fontWeight: isActive ? 700 : 400,
                                                        },
                                                    }}
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
            variant={isDesktop ? 'permanent' : 'temporary'}
            open={isDesktop || mobileOpen}
            onClose={onMobileClose}
            sx={{
                ...(isDesktop
                    ? { width: SIDE_NAV_WIDTH, flexShrink: 0, display: 'flex' }
                    : {}),
                '& .MuiDrawer-paper': {
                    width: SIDE_NAV_WIDTH,
                    boxSizing: 'border-box',
                    borderRight: '1px solid',
                    borderColor: dividerColor,
                    ...(isDesktop ? { position: 'relative', height: 'auto' } : {}),
                },
            }}
        >
            {content}
        </Drawer>
    );
}