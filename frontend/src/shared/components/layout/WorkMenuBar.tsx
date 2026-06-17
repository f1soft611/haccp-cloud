import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';
import type { UserRole } from '../../store/authStore';
import type { MenuGroup, MenuIconName } from './workMenuConfig';

const MENU_GLYPH_MAP: Record<MenuIconName, string> = {
  Dashboard: 'D',
  Settings: 'S',
  Menu: 'M',
  Factory: 'F',
  AdminPanelSettings: 'P',
  Business: 'B',
  People: 'U',
  Assignment: 'A',
  Inventory: 'I',
  Build: 'W',
  Category: 'C',
  Security: 'S',
  Link: '↗',
  History: 'H',
  AccessTime: 'T',
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
        borderColor: isSelectedGroupExpanded ? 'transparent' : 'divider',
        bgcolor: 'common.white',
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
                    color: isSelected ? '#0f2942' : 'text.secondary',
                    bgcolor: isSelected ? '#e7edf5' : 'transparent',
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
                            bgcolor: '#f8fafd',
                          },
                        }
                      : {}),
                    '&:hover': {
                      bgcolor: isSelected
                        ? '#e7edf5'
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
              bgcolor: 'rgba(15,23,42,0.12)',
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
                bgcolor: '#f8fafd',
                borderBottom: '1px solid',
                borderColor: 'rgba(15,23,42,0.14)',
                boxShadow: '0 10px 24px rgba(15,23,42,0.10)',
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
                    const glyph = item.icon ? MENU_GLYPH_MAP[item.icon] : null;

                    return (
                      <Button
                        key={item.path}
                        component={NavLink}
                        to={item.path}
                        aria-label={item.label}
                        color="primary"
                        variant="text"
                        sx={{
                          px: 2.25,
                          py: 2.1,
                          borderRadius: 0,
                          color: 'text.primary',
                          borderRight: { xs: 'none', md: '1px solid' },
                          borderColor: 'rgba(15,23,42,0.16)',
                          justifyContent: 'flex-start',
                          textAlign: 'left',
                          alignItems: 'flex-start',
                          transition:
                            'background-color 150ms ease, color 150ms ease',
                          '&.active': {
                            bgcolor: 'rgba(31,79,143,0.08)',
                            color: '#0f2942',
                          },
                          '&:hover': {
                            bgcolor: 'rgba(15,23,42,0.05)',
                          },
                        }}
                      >
                        <Stack
                          spacing={1}
                          sx={{ alignItems: 'flex-start', width: '100%' }}
                        >
                          <Stack spacing={0.8} sx={{ alignItems: 'flex-start' }}>
                            <Stack direction="row" spacing={0.8} alignItems="center">
                              {glyph ? (
                                <Typography
                                  variant="caption"
                                  fontWeight={700}
                                  sx={{
                                    color: '#35618f',
                                    bgcolor: 'rgba(31,79,143,0.08)',
                                    borderRadius: '999px',
                                    px: 0.8,
                                    py: 0.15,
                                  }}
                                >
                                  {glyph}
                                </Typography>
                              ) : null}
                              <Typography
                                variant="subtitle1"
                                fontWeight={700}
                                sx={{
                                  pb: 0.4,
                                  borderBottom: '1px solid rgba(15,23,42,0.20)',
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
