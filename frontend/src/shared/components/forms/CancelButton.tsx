import { Button, type ButtonProps } from '@mui/material';
import styles from '../sharedComponents.module.css';

// 등록/수정 다이얼로그 하단의 취소 버튼, 검색바 조회 버튼과 같은 모양
export function CancelButton({ children = '취소', className, ...props }: ButtonProps) {
  return (
    <Button
      variant="outlined"
      {...props}
      className={className ? `${styles.formDialogCancel} ${className}` : styles.formDialogCancel}
    >
      {children}
    </Button>
  );
}