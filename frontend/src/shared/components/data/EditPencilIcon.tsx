import Box from '@mui/material/Box';
import editPencilIconUrl from '../../../assets/icons/bticon_wri.svg';

/** 목록과 카드의 수정 버튼에 쓰는 연필 아이콘. SVG 내부 전역 클래스 충돌을 막기 위해 img 로 표시한다. */
export function EditPencilIcon() {
  return (
    <Box
      component="img"
      src={editPencilIconUrl}
      alt=""
      data-testid="EditPencilIcon"
      sx={{
        display: 'block',
        width: 20,
        height: 20,
        objectFit: 'contain',
        '.Mui-disabled &': { opacity: 0.4 },
      }}
    />
  );
}