import { Box, Container } from '@mui/material';
import type { PropsWithChildren } from 'react';
import styles from '../sharedComponents.module.css';
import { useSharedScope } from '../useSharedScope';

export function PageShell({ children }: PropsWithChildren) {
  const scope = useSharedScope();

  // 기존 -> sx, 스타일 prop 으로 스타일 지정
  // 변경 -> sharedComponents.module.css 클래스 사용
  return (
    <Box {...scope} className={`${scope.className} ${styles.pageShell}`}>
      <Container maxWidth="xl" className={styles.pageShellContainer}>{children}</Container>
    </Box>
  );
}
