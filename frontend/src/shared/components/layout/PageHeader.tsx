import { Box, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  useCurrentMenuGroupLabel,
  useUserMenuMetadata,
} from './userMenuMetadataContext';

export type PageHeaderProps = {
  title: string;
  groupLabel?: string;
  description?: string;
  useMenuMetadata?: boolean;
  showGroupLabel?: boolean;
};

export function PageHeader({
  title,
  groupLabel,
  description,
  useMenuMetadata = true,
  showGroupLabel = true,
}: PageHeaderProps) {
  const location = useLocation();
  const currentMenuGroupLabel = useCurrentMenuGroupLabel();
  const menuMetadataByPath = useUserMenuMetadata();

  const currentMetadata = useMemo(() => {
    const matches = Object.keys(menuMetadataByPath).filter((path) =>
      location.pathname.startsWith(path),
    );

    if (matches.length === 0) {
      return undefined;
    }

    const bestPath = matches.sort((a, b) => b.length - a.length)[0];
    return menuMetadataByPath[bestPath];
  }, [location.pathname, menuMetadataByPath]);

  const resolvedTitle =
    useMenuMetadata && currentMetadata?.menuNm ? currentMetadata.menuNm : title;
  const resolvedDescription =
    useMenuMetadata && currentMetadata?.menuDc
      ? currentMetadata.menuDc
      : description;
  const resolvedGroupLabel = showGroupLabel
    ? currentMenuGroupLabel || groupLabel
    : undefined;

  return (
    <Box
      sx={{
        pl: 1.5,
        borderLeft: '3px solid',
        borderColor: 'primary.main',
      }}
    >
      {resolvedGroupLabel ? (
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          sx={{ mb: 0.4 }}
        >
          <Typography variant="caption" color="text.secondary">
            {resolvedGroupLabel}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            /
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {resolvedTitle}
          </Typography>
        </Stack>
      ) : null}

      <Typography
        component="h1"
        variant="h5"
        fontWeight={700}
        sx={{ lineHeight: 1.2 }}
      >
        {resolvedTitle}
      </Typography>

      {resolvedDescription ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {resolvedDescription}
        </Typography>
      ) : null}
    </Box>
  );
}
