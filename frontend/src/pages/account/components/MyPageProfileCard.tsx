import {
  Avatar,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import type { ChangeEvent } from 'react';

type MyPageProfileCardProps = {
  profilePreview: string;
  initials: string;
  visibleName: string;
  visibleRole: string;
  onProfileImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function MyPageProfileCard({
  profilePreview,
  initials,
  visibleName,
  visibleRole,
  onProfileImageChange,
}: MyPageProfileCardProps) {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={2} alignItems="center" sx={{ py: 1 }}>
          <Button
            component="label"
            variant="text"
            sx={{ p: 0, borderRadius: '50%', minWidth: 0 }}
          >
            <Avatar
              src={profilePreview || undefined}
              sx={{ width: 120, height: 120, fontSize: '2.2rem' }}
            >
              {initials}
            </Avatar>
            <input
              hidden
              accept="image/*"
              type="file"
              onChange={onProfileImageChange}
            />
          </Button>
          <Typography variant="caption" color="text.secondary">
            프로필 이미지를 변경하려면 아바타를 클릭하세요.
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
