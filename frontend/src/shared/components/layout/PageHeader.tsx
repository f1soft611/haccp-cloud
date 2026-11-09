import { Box, Stack, Typography } from '@mui/material';
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

  // 기존 -> sx, 스타일 prop 으로 스타일 지정
  // 변경 -> sharedComponents.module.css 클래스 사용
  return (
    <Box {...scope} className={`${scope.className} ${styles.pageHeader}`}>
      {resolvedGroupLabel ? (
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          className={styles.pageHeaderPath}
        >
          <Typography variant="caption" className={styles.textSecondary}>
            {resolvedGroupLabel}
          </Typography>
          <Typography variant="caption" className={styles.textDisabled}>
            /
          </Typography>
          <Typography variant="caption" className={styles.textSecondary}>
            {resolvedTitle}
          </Typography>
        </Stack>
      ) : null}

      <Typography
        component="h1"
        variant="h5"
        className={styles.pageHeaderTitle}
      >
        {resolvedTitle}
      </Typography>

      {resolvedDescription ? (
        <Typography variant="body2" className={`${styles.textSecondary} ${styles.pageHeaderDescription}`}>
          {resolvedDescription}
        </Typography>
      ) : null}
    </Box>
  );
}
