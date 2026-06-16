import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';
import type { UserRole } from '../store/authStore';
import type { MenuGroup } from './workMenuConfig';

export type MenuItem = {
  label: string;
  description?: string;
  path: string;
  roles: UserRole[];
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
            spacing={0}
            sx={{
              justifyContent: 'flex-start',
              flexWrap: 'wrap',
              position: 'relative',
              zIndex: 2,
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
                  sx={{
                    fontWeight: 800,
                    borderRadius: 0,
                    px: 2.5,
                    py: 1.5,
                    color: isSelected ? 'primary.dark' : 'text.primary',
                    bgcolor: isSelected ? '#D7E2EF' : 'transparent',
                    borderLeft: '1px solid',
                    borderRight: '1px solid',
                    borderColor: isSelected
                      ? 'rgba(15,23,42,0.12)'
                      : 'transparent',
                    '&:hover': {
                      bgcolor: isSelected ? '#D7E2EF' : '#EEF4FB',
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
              bgcolor: 'rgba(15,23,42,0.18)',
              backdropFilter: 'blur(2px)',
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
                borderTop: '1px solid',
                borderBottom: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 14px 26px rgba(15,23,42,0.16)',
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
                  {(selectedGroup?.items ?? []).map((item) => (
                    <Button
                      key={item.path}
                      component={NavLink}
                      to={item.path}
                      aria-label={item.label}
                      color="primary"
                      variant="text"
                      sx={{
                        px: 1,
                        py: 2.8,
                        borderRadius: 0,
                        color: 'text.primary',
                        borderRight: { xs: 'none', md: '1px solid' },
                        borderBottom: '1px solid',
                        borderColor: 'rgba(15,23,42,0.14)',
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        alignItems: 'flex-start',
                        '&.active': {
                          bgcolor: '#EEF4FB',
                          color: 'primary.dark',
                        },
                      }}
                    >
                      <Stack spacing={0.7} sx={{ alignItems: 'flex-start' }}>
                        <Typography variant="subtitle1" fontWeight={800}>
                          {item.label}
                        </Typography>
                        {item.description ? (
                          <Typography variant="body2" color="text.secondary">
                            {item.description}
                          </Typography>
                        ) : null}
                      </Stack>
                    </Button>
                  ))}
                </Box>
              </Container>
            </Box>
          </Box>
        </>
      ) : null}
    </Box>
  );
}
