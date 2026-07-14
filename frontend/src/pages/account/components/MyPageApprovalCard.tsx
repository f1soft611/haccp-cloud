import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import type { ChangeEvent } from 'react';

type MyPageApprovalCardProps = {
  approvalPreview: string;
  onApprovalImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function MyPageApprovalCard({
  approvalPreview,
  onApprovalImageChange,
}: MyPageApprovalCardProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 2.5,
        bgcolor: 'background.paper',
      }}
    >
      <Stack spacing={1.25} alignItems="center">
        <Typography variant="subtitle1" fontWeight={800}>
          결재 서명/도장 이미지
        </Typography>
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: 2.5,
            border: '1px dashed',
            borderColor: 'divider',
            bgcolor: 'rgba(20,184,166,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            p: 1,
          }}
        >
          {approvalPreview ? (
            <Box
              component="img"
              src={approvalPreview}
              alt="결재 이미지 미리보기"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              아직 등록된 이미지가 없습니다.
            </Typography>
          )}
        </Box>
        <Button
          variant="outlined"
          component="label"
          size="small"
          sx={{ width: 160 }}
        >
          이미지 업로드
          <input
            hidden
            accept="image/*"
            type="file"
            onChange={onApprovalImageChange}
          />
        </Button>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ maxWidth: 220, textAlign: 'center' }}
        >
          서명/도장 이미지는 단일 결재 이미지로 통합 관리합니다.
        </Typography>
      </Stack>
    </Paper>
  );
}
