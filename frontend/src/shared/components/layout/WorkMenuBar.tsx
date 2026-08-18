import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { NavLink, useLocation } from 'react-router-dom';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import PrecisionManufacturingRoundedIcon from '@mui/icons-material/PrecisionManufacturingRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import type { UserRole } from '../../store/authStore';
import type { MenuGroup, MenuIconName } from './workMenuConfig';
import { prefetchRouteByPath } from '../../../app/router/routePrefetch';

type MenuIconComponent = typeof DashboardRoundedIcon;

const MENU_ICON_MAP: Record<MenuIconName, MenuIconComponent> = {
  Dashboard: DashboardRoundedIcon,
  Settings: SettingsRoundedIcon,
  Menu: MenuRoundedIcon,
  Factory: PrecisionManufacturingRoundedIcon,
  AdminPanelSettings: AdminPanelSettingsRoundedIcon,
  Business: BusinessRoundedIcon,
  People: PeopleRoundedIcon,
  Assignment: AssignmentRoundedIcon,
  Inventory: Inventory2RoundedIcon,
  Build: BuildRoundedIcon,
  Category: CategoryRoundedIcon,
  Security: SecurityRoundedIcon,
  Link: LinkRoundedIcon,
  History: HistoryRoundedIcon,
  AccessTime: AccessTimeRoundedIcon,
};

type WorkMenuBarProps = {
  menuGroups: MenuGroup[];
  role: UserRole;
};

export function WorkMenuBar({ menuGroups, role }: WorkMenuBarProps) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const [expandedGroupKey, setExpandedGroupKey] = useState<string | null>(null);
  const [overlayTop, setOverlayTop] = useState<number>(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

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

  const routeMatchedGroup = visibleGroups.find((group) =>
    group.items.some((item) => location.pathname.startsWith(item.path)),
  );

  useEffect(() => {
    const nextGroupKey = routeMatchedGroup?.key ?? null;
    setSelectedGroupKey((currentGroupKey) =>
      currentGroupKey === nextGroupKey ? currentGroupKey : nextGroupKey,
    );
  }, [routeMatchedGroup?.key]);

  const selectedGroup =
    visibleGroups.find((group) => group.key === selectedGroupKey) ??
    routeMatchedGroup ??
    visibleGroups[0];

  const isSelectedGroupExpanded =
    selectedGroup?.key !== undefined && expandedGroupKey === selectedGroup.key;

  useEffect(() => {
    if (!isSelectedGroupExpanded) {
      return;
    }

    const updateOverlayTop = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      setOverlayTop(rect.bottom);
    };

    updateOverlayTop();
    window.addEventListener('resize', updateOverlayTop);
    window.addEventListener('scroll', updateOverlayTop, { passive: true });

    return () => {
      window.removeEventListener('resize', updateOverlayTop);
      window.removeEventListener('scroll', updateOverlayTop);
    };
  }, [isSelectedGroupExpanded]);

  const handleGroupClick = (groupKey: string) => {
    setSelectedGroupKey(groupKey);
    setExpandedGroupKey((currentKey) =>
      currentKey === groupKey ? null : groupKey,
    );
  };

  return (
    <Box
      ref={rootRef}
      data-testid="work-menu-bar"
      data-nav-variant="segmented"
      sx={{
        py: 0,
        borderBottom: '1px solid',
        borderColor: isSelectedGroupExpanded
          ? 'transparent'
          : isDarkMode
            ? 'rgba(251,191,36,0.22)'
            : 'divider',
        bgcolor: isDarkMode ? '#111827' : 'common.white',
        position: 'relative',
        zIndex: 20,
      }}
    >
      <Container>
        {visibleGroups.length > 0 ? (
          <Stack
            direction="row"
            spacing={0.75}
            sx={{
              justifyContent: 'flex-start',
              flexWrap: 'wrap',
              alignItems: 'stretch',
              position: 'relative',
              zIndex: 2,
              py: 0,
              overflowX: { xs: 'auto', md: 'visible' },
              overflowY: 'visible',
            }}
          >
            {visibleGroups.map((group) => {
              const isSelected = selectedGroup?.key === group.key;

              return (
                <Button
                  key={group.key}
                  variant="text"
                  color="primary"
                  onClick={() => handleGroupClick(group.key)}
                  aria-pressed={isSelected}
                  sx={{
                    minHeight: 52,
                    fontWeight: isSelected ? 700 : 500,
                    borderRadius: 0,
                    px: 2.5,
                    py: 0,
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap',
                    position: 'relative',
                    zIndex: isSelected && isSelectedGroupExpanded ? 35 : 2,
                    color:
                      isSelected && isDarkMode
                        ? '#fef3c7'
                        : isSelected
                          ? '#0f5f59'
                          : isDarkMode
                            ? 'rgba(248,250,252,0.76)'
                            : 'text.secondary',
                    bgcolor: isSelected
                      ? isDarkMode
                        ? 'rgba(251,191,36,0.14)'
                        : '#e7edf5'
                      : 'transparent',
                    border: '1px solid transparent',
                    transition:
                      'background-color 150ms ease, color 150ms ease, border-color 150ms ease',
                    ...(isSelected && isSelectedGroupExpanded
                      ? {
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: -10,
                            height: 10,
                            bgcolor: isDarkMode ? '#0f172a' : '#f8fafd',
                          },
                        }
                      : {}),
                    '&:hover': {
                      bgcolor: isSelected
                        ? isDarkMode
                          ? 'rgba(251,191,36,0.14)'
                          : '#ddfbf5'
                        : isDarkMode
                          ? 'rgba(251,191,36,0.08)'
                          : 'rgba(15,23,42,0.05)',
                    },
                  }}
                >
                  {group.label}
                </Button>
              );
            })}
          </Stack>
        ) : null}
      </Container>

      {isSelectedGroupExpanded ? (
        <>
          <Box
            onClick={() => setExpandedGroupKey(null)}
            sx={{
              position: 'fixed',
              top: overlayTop,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: isDarkMode ? 'rgba(2,6,23,0.48)' : 'rgba(15,23,42,0.12)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 24,
            }}
          />

          <Box
            sx={{
              position: 'absolute',
              top: 'calc(100% - 1px)',
              left: 0,
              right: 0,
              zIndex: 30,
            }}
          >
            <Box
              sx={{
                width: '100%',
                bgcolor: isDarkMode ? '#0f172a' : '#f8fafd',
                borderBottom: '1px solid',
                borderColor: isDarkMode
                  ? 'rgba(251,191,36,0.2)'
                  : 'rgba(15,23,42,0.14)',
                boxShadow: isDarkMode
                  ? '0 14px 30px rgba(2,6,23,0.52)'
                  : '0 10px 24px rgba(15,23,42,0.10)',
              }}
            >
              <Container>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: 'repeat(3, minmax(0, 1fr))',
                    },
                    py: 1,
                  }}
                >
                  {(selectedGroup?.items ?? []).map((item) => {
                    const IconComponent = item.icon
                      ? MENU_ICON_MAP[item.icon]
                      : null;

                    return (
                      <Button
                        key={item.path}
                        component={NavLink}
                        to={item.path}
                        onMouseEnter={() => {
                          void prefetchRouteByPath(item.path);
                        }}
                        onFocus={() => {
                          void prefetchRouteByPath(item.path);
                        }}
                        aria-label={item.label}
                        color="primary"
                        variant="text"
                        sx={{
                          px: 2.25,
                          py: 2.1,
                          borderRadius: 0,
                          color: isDarkMode ? '#f8fafc' : 'text.primary',
                          borderRight: { xs: 'none', md: '1px solid' },
                          borderColor: isDarkMode
                            ? 'rgba(251,191,36,0.16)'
                            : 'rgba(15,23,42,0.16)',
                          justifyContent: 'flex-start',
                          textAlign: 'left',
                          alignItems: 'flex-start',
                          transition:
                            'background-color 150ms ease, color 150ms ease',
                          '&.active': {
                            bgcolor: isDarkMode
                              ? 'rgba(251,191,36,0.14)'
                              : 'rgba(31,79,143,0.08)',
                            color: isDarkMode ? '#fef3c7' : '#0f5f59',
                          },
                          '&:hover': {
                            bgcolor: isDarkMode
                              ? 'rgba(251,191,36,0.08)'
                              : 'rgba(20,184,166,0.12)',
                          },
                        }}
                      >
                        <Stack
                          spacing={1}
                          sx={{ alignItems: 'flex-start', width: '100%' }}
                        >
                          <Stack
                            spacing={0.8}
                            sx={{ alignItems: 'flex-start' }}
                          >
                            <Stack
                              direction="row"
                              spacing={0.8}
                              alignItems="center"
                            >
                              {IconComponent ? (
                                <IconComponent
                                  fontSize="small"
                                  sx={{
                                    color: isDarkMode ? '#fbbf24' : '#0f766e',
                                    bgcolor: isDarkMode
                                      ? 'rgba(251,191,36,0.12)'
                                      : 'rgba(20,184,166,0.12)',
                                    borderRadius: '999px',
                                    p: 0.4,
                                    boxSizing: 'content-box',
                                  }}
                                />
                              ) : null}
                              <Typography
                                variant="subtitle1"
                                fontWeight={700}
                                sx={{
                                  pb: 0.4,
                                  borderBottom: isDarkMode
                                    ? '1px solid rgba(251,191,36,0.24)'
                                    : '1px solid rgba(15,23,42,0.20)',
                                  minWidth: { xs: '70%', md: '80%' },
                                }}
                              >
                                {item.label}
                              </Typography>
                            </Stack>
                            {item.description ? (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ lineHeight: 1.5 }}
                              >
                                {item.description}
                              </Typography>
                            ) : null}
                          </Stack>
                        </Stack>
                      </Button>
                    );
                  })}
                </Box>
              </Container>
            </Box>
          </Box>
        </>
      ) : null}
    </Box>
  );
}
