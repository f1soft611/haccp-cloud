import { Box, Stack, Typography } from '@mui/material';
import { House } from 'lucide-react';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  useCurrentMenuGroupLabel,
  useUserMenuMetadata,
} from './userMenuMetadataContext';
import styles from '../sharedComponents.module.css';
import { useSharedScope } from '../useSharedScope';

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
  const scope = useSharedScope();
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
    <Box {...scope} className={`${scope.className} ${styles.pageHeader}`}>
      <Box>
        <Typography
          component="h1"
          variant="h5"
          className={styles.pageHeaderTitle}
        >
          {resolvedTitle}
        </Typography>

        {resolvedDescription ? (
          <Typography variant="body2" className={styles.pageHeaderDescription}>
            {resolvedDescription}
          </Typography>
        ) : null}
      </Box>

      {resolvedGroupLabel ? (
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          className={styles.pageHeaderPath}
        >
          <House size={14} />
          <Typography variant="body2" className={styles.pageHeaderPathText}>
            {resolvedGroupLabel}
          </Typography>
          <Typography variant="body2" className={styles.pageHeaderPathText}>
            {'>'}
          </Typography>
          <Typography variant="body2" className={styles.pageHeaderPathText}>
            {resolvedTitle}
          </Typography>
        </Stack>
      ) : null}
    </Box>
  );
}
