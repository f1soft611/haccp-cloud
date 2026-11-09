import { Button, Paper, Stack } from '@mui/material';
import type { FormEvent, ReactNode } from 'react';
import styles from '../sharedComponents.module.css';

type SearchFilterBarProps = {
  children: ReactNode;
  onSearch: () => void;
  onReset?: () => void;
  disabled?: boolean;
  actions?: ReactNode;
  detail?: ReactNode;
};

// 목록 화면 검색필터의 바깥 틀과 버튼 영역. 조건 입력칸은 children 으로 받는다.
export function SearchFilterBar({
  children,
  onSearch,
  onReset,
  disabled,
  actions,
  detail,
}: SearchFilterBarProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch();
  };

  // 기존 -> sx, 스타일 prop 으로 스타일 지정
  // 변경 -> sharedComponents.module.css 클래스 사용
  return (
    // noValidate: 입력이 덜 끝난 날짜 칸이 있어도 브라우저 검증 말풍선 없이 조회한다.
    <Paper component="form" noValidate onSubmit={handleSubmit} className={`${styles.scope} ${styles.searchFilter}`}>
      <Stack spacing={1.5}>
        {/* useFlexGap: 없으면 Stack 의 간격 규칙이 버튼 묶음의 ml auto 를 덮어쓴다. */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          useFlexGap
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          {children}
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            className={styles.searchFilterActions}
          >
            {onReset ? (
              <Button variant="outlined" onClick={onReset}>
                초기화
              </Button>
            ) : null}
            <Button type="submit" variant="contained" disabled={disabled} className={styles.searchFilterSubmit}>
              조회
            </Button>
            {actions}
          </Stack>
        </Stack>
        {detail}
      </Stack>
    </Paper>
  );
}