import { Avatar, Card, CardContent, Stack, Typography } from '@mui/material';

type AccountProfileSummaryCardProps = {
  profilePreview: string;
  initials: string;
  visibleName: string;
  visibleRole: string;
};

export function AccountProfileSummaryCard({
  profilePreview,
  initials,
  visibleName,
  visibleRole,
}: AccountProfileSummaryCardProps) {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={2} alignItems="center" sx={{ py: 1 }}>
          <Avatar
            src={profilePreview || undefined}
            sx={{ width: 120, height: 120, fontSize: '2.2rem' }}
          >
            {initials}
          </Avatar>
          <Typography variant="caption" color="text.secondary">
            현재 로그인 계정 정보입니다.
          </Typography>
          <Stack spacing={0.5} alignItems="center">
            <Typography variant="h6" fontWeight={800}>
              {visibleName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {visibleRole}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
