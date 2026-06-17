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
        borderColor: 'divider',
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
              position: 'relative',
              zIndex: 2,
              py: 1,
              overflowX: 'auto',
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
                    minHeight: 36,
                    fontWeight: isSelected ? 700 : 500,
                    borderRadius: 1.5,
                    px: 2,
                    py: 0.75,
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap',
                    color: isSelected ? 'primary.main' : 'text.secondary',
                    bgcolor: isSelected ? 'rgba(31,79,143,0.09)' : 'transparent',
                    border: '1px solid',
                    borderColor: isSelected ? 'rgba(31,79,143,0.28)' : 'transparent',
                    transition:
                      'background-color 150ms ease, color 150ms ease, border-color 150ms ease',
                    '&:hover': {
                      bgcolor: 'rgba(31,79,143,0.07)',
                      borderColor: 'rgba(31,79,143,0.18)',
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
              bgcolor: 'rgba(15,23,42,0.08)',
              zIndex: 24,
            }}
          />

          <Box
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 30,
            }}
          >
            <Box
              sx={{
                width: '100%',
                bgcolor: 'common.white',
                borderBottom: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 8px 24px rgba(15,23,42,0.09)',
              }}
            >
              <Container>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: 'repeat(4, minmax(0, 1fr))',
                    },
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
                          px: 2,
                          py: 2,
                          borderRadius: 0,
                          color: 'text.primary',
                          borderRight: { xs: 'none', md: '1px solid' },
                          borderBottom: '1px solid',
                          borderColor: 'rgba(15,23,42,0.10)',
                          justifyContent: 'flex-start',
                          textAlign: 'left',
                          alignItems: 'flex-start',
                          transition:
                            'background-color 150ms ease, color 150ms ease',
                          '&.active': {
                            bgcolor: '#EEF4FB',
                            color: 'primary.main',
                          },
                          '&:hover': {
                            bgcolor: '#EEF4FB',
                          },
                        }}
                      >
                        <Stack
                          spacing={0.75}
                          direction="row"
                          sx={{ alignItems: 'flex-start', width: '100%' }}
                        >
                          {glyph ? (
                            <Box
                              sx={{
                                width: 30,
                                height: 30,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '999px',
                                bgcolor: 'rgba(31,79,143,0.10)',
                                color: 'primary.main',
                                flexShrink: 0,
                                mt: 0.1,
                              }}
                            >
                              <Typography variant="caption" fontWeight={800}>
                                {glyph}
                              </Typography>
                            </Box>
                          ) : null}
                          <Stack
                            spacing={0.7}
                            sx={{ alignItems: 'flex-start' }}
                          >
                            <Typography variant="subtitle1" fontWeight={700}>
                              {item.label}
                            </Typography>
                            {item.description ? (
                              <Typography
                                variant="body2"
                                color="text.secondary"
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
