import { Grid, Stack } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractApiErrorMessage } from '../../services/api/errorMessage';
import { changeMyPassword } from '../../services/organization/usersService';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { getRoleLabel } from '../../shared/constants/labels';
import { useAuthStore, type UserRole } from '../../shared/store/authStore';
import { AccountPasswordFormPanel } from './components/AccountPasswordFormPanel';
import { AccountProfileSummaryCard } from './components/AccountProfileSummaryCard';

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

export function AccountPasswordPage() {
  const navigate = useNavigate();
  const displayName = useAuthStore((state) => state.displayName);
  const userId = useAuthStore((state) => state.userId);
  const role = useAuthStore((state) => state.role);
  const profileImage = useAuthStore((state) => state.profileImage);

  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const resolvedRole: UserRole = role;
  const visibleName = displayName.trim() || userId.trim() || '사용자';
  const visibleRole = getRoleLabel(resolvedRole);
  const initials = useMemo(
    () => resolveInitials(visibleName, userId),
    [userId, visibleName],
  );

  const passwordMutation = useMutation({
    mutationFn: () =>
      changeMyPassword({
        currentPassword,
        newPassword: nextPassword,
        confirmPassword,
      }),
    onSuccess: (message) => {
      setNoticeMessage(message || '비밀번호가 성공적으로 변경되었습니다.');
      setErrorMessage('');
      setCurrentPassword('');
      setNextPassword('');
      setConfirmPassword('');
    },
    onError: (error) => {
      setNoticeMessage('');
      setErrorMessage(
        extractApiErrorMessage(error, '비밀번호 변경에 실패했습니다.'),
      );
    },
  });

  const handleSubmit = () => {
    setNoticeMessage('');
    setErrorMessage('');

    if (!currentPassword.trim()) {
      setErrorMessage('현재 비밀번호를 입력해주세요.');
      return;
    }
    if (!nextPassword.trim()) {
      setErrorMessage('새 비밀번호를 입력해주세요.');
      return;
    }
    if (nextPassword.trim().length < 8) {
      setErrorMessage('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (!confirmPassword.trim()) {
      setErrorMessage('새 비밀번호 확인을 입력해주세요.');
      return;
    }
    if (nextPassword !== confirmPassword) {
      setErrorMessage('새 비밀번호와 확인 값이 일치하지 않습니다.');
      return;
    }
    if (currentPassword === nextPassword) {
      setErrorMessage('현재 비밀번호와 다른 새 비밀번호를 입력해주세요.');
      return;
    }

    passwordMutation.mutate();
  };

  const submitDisabled =
    passwordMutation.isPending ||
    !currentPassword.trim() ||
    !nextPassword.trim() ||
    !confirmPassword.trim();

  return (
    <Stack spacing={2.5} data-testid="account-password-page">
      <PageHeader
        title="비밀번호 변경"
        description="현재 비밀번호 확인 후 새 비밀번호로 변경합니다."
        useMenuMetadata={false}
        showGroupLabel={false}
      />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <AccountProfileSummaryCard
            profilePreview={profileImage ?? ''}
            initials={initials}
            visibleName={visibleName}
            visibleRole={visibleRole}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <AccountPasswordFormPanel
            currentPassword={currentPassword}
            nextPassword={nextPassword}
            confirmPassword={confirmPassword}
            submitDisabled={submitDisabled}
            isSubmitting={passwordMutation.isPending}
            noticeMessage={noticeMessage}
            errorMessage={errorMessage}
            onChangeCurrentPassword={setCurrentPassword}
            onChangeNextPassword={setNextPassword}
            onChangeConfirmPassword={setConfirmPassword}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/account/my-page')}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}
