import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
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
      // 기존 -> isDarkMode 로 모든 색 분기 / 변경 -> theme.ts 의 workMenu 토큰 사용
        borderBottom: '1px solid',
        borderColor: isSelectedGroupExpanded
          ? 'transparent'
          : 'workMenu.barBorder',
        bgcolor: 'workMenu.barBg',
        position: 'relative',
        zIndex: 20,
      }}
    >
      <Container maxWidth="xl">
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
                    color: isSelected
                      ? 'workMenu.groupSelectedText'
                      : 'workMenu.groupText',
                    bgcolor: isSelected ? 'workMenu.groupSelectedBg' : 'transparent',
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
                            bgcolor: 'workMenu.panelBg',
                          },
                        }
                      : {}),
                    '&:hover': {
                      bgcolor: isSelected
                        ? 'workMenu.groupSelectedHoverBg'
                        : 'workMenu.groupHoverBg',
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
              bgcolor: 'workMenu.backdrop',
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
                bgcolor: 'workMenu.panelBg',
                borderBottom: '1px solid',
                borderColor: 'workMenu.panelBorder',
                boxShadow: (theme) => theme.palette.workMenu.panelShadow,
              }}
            >
              <Container maxWidth="xl">
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: 'repeat(4, minmax(0, 1fr))',
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
                        onClick={() => setExpandedGroupKey(null)}
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
                          color: 'workMenu.itemText',
                          borderRight: { xs: 'none', md: '1px solid' },
                          borderColor: 'workMenu.itemDivider',
                          justifyContent: 'flex-start',
                          textAlign: 'left',
                          alignItems: 'flex-start',
                          transition:
                            'background-color 150ms ease, color 150ms ease',
                          '&.active': {
                            bgcolor: 'workMenu.itemActiveBg',
                            color: 'workMenu.groupSelectedText',
                          },
                          '&:hover': {
                            bgcolor: 'workMenu.itemHoverBg',
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
                                    color: 'workMenu.iconColor',
                                    bgcolor: 'workMenu.iconBg',
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
                                  borderBottom: (theme) =>
                                    `1px solid ${theme.palette.workMenu.titleUnderline}`,
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
