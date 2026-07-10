import { useMemo, useState, type ChangeEvent } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { useAuthStore } from '../../shared/store/authStore';
import { getRoleLabel } from '../../shared/constants/labels';

type UploadSlot = 'profileImage' | 'signatureImage' | 'stampImage';

function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('이미지 파일을 읽을 수 없습니다.'));
    reader.readAsDataURL(file);
  });
}

function resolveInitials(displayName: string, userId: string): string {
  const visibleName = displayName.trim();
  if (visibleName) {
    return visibleName.slice(0, 1).toUpperCase();
  }

  const visibleUserId = userId.trim();
  if (visibleUserId) {
    return visibleUserId.slice(0, 1).toUpperCase();
  }

  return 'U';
}

export function MyPage() {
  const displayName = useAuthStore((state) => state.displayName);
  const userId = useAuthStore((state) => state.userId);
  const role = useAuthStore((state) => state.role);
  const email = useAuthStore((state) => state.email);
  const departmentName = useAuthStore((state) => state.departmentName);
  const profileImage = useAuthStore((state) => state.profileImage);
  const signatureImage = useAuthStore((state) => state.signatureImage);
  const stampImage = useAuthStore((state) => state.stampImage);

  const [profilePreview, setProfilePreview] = useState(profileImage ?? '');
  const [signaturePreview, setSignaturePreview] = useState(
    signatureImage ?? '',
  );
  const [stampPreview, setStampPreview] = useState(stampImage ?? '');
  const [noticeMessage, setNoticeMessage] = useState(
    '프로필과 결재 이미지는 현재 화면에서 미리보기만 제공합니다.',
  );

  const visibleName = displayName.trim() || userId.trim() || '사용자';
  const visibleEmail = email?.trim() || '미등록';
  const visibleDepartment = departmentName?.trim() || '미등록';
  const visibleRole = getRoleLabel(role);

  const initials = useMemo(
    () => resolveInitials(visibleName, userId),
    [userId, visibleName],
  );

  const handleFileChange = async (
    slot: UploadSlot,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setNoticeMessage('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setNoticeMessage('이미지 파일 크기는 2MB 이하만 가능합니다.');
      return;
    }

    try {
      const dataUrl = await readImageFile(file);

      if (slot === 'profileImage') {
        setProfilePreview(dataUrl);
      }

      if (slot === 'signatureImage') {
        setSignaturePreview(dataUrl);
      }

      if (slot === 'stampImage') {
        setStampPreview(dataUrl);
      }

      setNoticeMessage('미리보기 이미지가 업데이트되었습니다.');
    } catch {
      setNoticeMessage('이미지를 읽는 중 오류가 발생했습니다.');
    }
  };

  const imageField = (
    label: string,
    preview: string,
    slot: UploadSlot,
    helpText: string,
  ) => (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 3,
        height: '100%',
        bgcolor: 'background.paper',
      }}
    >
      <Stack spacing={1.5}>
        <Typography variant="subtitle1" fontWeight={800}>
          {label}
        </Typography>
        <Box
          sx={{
            width: '100%',
            minHeight: 160,
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
          {preview ? (
            <Box
              component="img"
              src={preview}
              alt={`${label} 미리보기`}
              sx={{ maxWidth: '100%', maxHeight: 160, objectFit: 'contain' }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              아직 등록된 이미지가 없습니다.
            </Typography>
          )}
        </Box>
        <Button variant="outlined" component="label">
          이미지 업로드
          <input
            hidden
            accept="image/*"
            type="file"
            onChange={(event) => {
              void handleFileChange(slot, event);
            }}
          />
        </Button>
        <Typography variant="caption" color="text.secondary">
          {helpText}
        </Typography>
      </Stack>
    </Paper>
  );

  return (
    <Stack spacing={2.5} data-testid="account-my-page">
      <PageHeader
        title="내 정보 관리"
        description="프로필 이미지와 결재 이미지를 관리합니다."
      />

      {noticeMessage ? <Alert severity="info">{noticeMessage}</Alert> : null}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Stack spacing={2} alignItems="center" sx={{ py: 1 }}>
                <Avatar
                  src={profilePreview || undefined}
                  sx={{ width: 120, height: 120, fontSize: '2.2rem' }}
                >
                  {initials}
                </Avatar>
                <Stack spacing={0.5} alignItems="center">
                  <Typography variant="h6" fontWeight={800}>
                    {visibleName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {visibleRole}
                  </Typography>
                </Stack>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                >
                  우측 카드에서 프로필, 결재 싸인, 도장 이미지를 각각 업로드할
                  수 있습니다.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Stack spacing={2.25}>
              <Typography variant="h6" fontWeight={800}>
                계정 정보
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="이름"
                    value={visibleName}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="이메일"
                    value={visibleEmail}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="부서"
                    value={visibleDepartment}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="권한"
                    value={visibleRole}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="사용자 ID"
                    value={userId || '미등록'}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 4 }}>
          {imageField(
            '프로필 이미지',
            profilePreview,
            'profileImage',
            '로그인 메뉴와 사용자 정보 카드에 사용할 이미지를 등록합니다.',
          )}
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          {imageField(
            '결재 싸인 이미지',
            signaturePreview,
            'signatureImage',
            '전자결재 문서에 사용할 싸인 이미지를 등록합니다.',
          )}
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          {imageField(
            '도장 이미지',
            stampPreview,
            'stampImage',
            '전자결재 문서에 사용할 도장 이미지를 등록합니다.',
          )}
        </Grid>
      </Grid>
    </Stack>
  );
}
