import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Grid, Stack } from '@mui/material';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { useAuthStore, type UserRole } from '../../shared/store/authStore';
import { getRoleLabel } from '../../shared/constants/labels';
import {
  changeMyPageImages,
  getMyPageProfile,
} from '../../services/organization/usersService';
import { MyPageProfileCard } from './components/MyPageProfileCard';
import { MyPageApprovalCard } from './components/MyPageApprovalCard';
import { MyPageAccountInfoPanel } from './components/MyPageAccountInfoPanel';

type UploadSlot = 'profileImage' | 'approvalImage';

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
  const updateUserImages = useAuthStore((state) => state.updateUserImages);

  const myPageQuery = useQuery({
    queryKey: ['account', 'my-page'],
    queryFn: getMyPageProfile,
    retry: false,
  });

  const accountProfile = myPageQuery.data;

  const [profilePreview, setProfilePreview] = useState(
    accountProfile?.profileImage ?? profileImage ?? '',
  );
  const [approvalPreview, setApprovalPreview] = useState(
    accountProfile?.stampImage ??
      accountProfile?.signatureImage ??
      signatureImage ??
      stampImage ??
      '',
  );
  const [noticeMessage, setNoticeMessage] = useState(
    '프로필과 결재 서명/도장 이미지는 등록 가능합니다.',
  );

  const resolvedName = accountProfile?.name ?? displayName;
  const resolvedUserId = accountProfile?.id ?? userId;
  const resolvedLoginId =
    userId.trim() || String(accountProfile?.id ?? '').trim();
  const resolvedEmail = accountProfile?.email ?? email ?? '';
  const resolvedDepartment = accountProfile?.department ?? departmentName ?? '';
  const resolvedRole: UserRole = accountProfile?.role ?? role;

  const visibleName = resolvedName.trim() || resolvedUserId.trim() || '사용자';
  const visibleEmail = resolvedEmail.trim() || '미등록';
  const visibleDepartment = resolvedDepartment.trim() || '미등록';
  const visibleRole = getRoleLabel(resolvedRole);

  const initials = useMemo(
    () => resolveInitials(visibleName, resolvedUserId),
    [resolvedUserId, visibleName],
  );

  useEffect(() => {
    setProfilePreview(accountProfile?.profileImage ?? profileImage ?? '');
  }, [accountProfile?.profileImage, profileImage]);

  useEffect(() => {
    setApprovalPreview(
      accountProfile?.stampImage ??
        accountProfile?.signatureImage ??
        signatureImage ??
        stampImage ??
        '',
    );
  }, [
    accountProfile?.signatureImage,
    accountProfile?.stampImage,
    signatureImage,
    stampImage,
  ]);

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
        const previousProfilePreview = profilePreview;
        setProfilePreview(dataUrl);
        try {
          const updated = await changeMyPageImages({ profileImage: dataUrl });
          updateUserImages({
            profileImage: updated.profileImage,
            signatureImage: updated.signatureImage,
            stampImage: updated.stampImage,
          });
          setNoticeMessage('프로필 이미지가 저장되었습니다.');
          return;
        } catch {
          setProfilePreview(previousProfilePreview);
          throw new Error('프로필 이미지 저장에 실패했습니다.');
        }
      }

      if (slot === 'approvalImage') {
        const previousApprovalPreview = approvalPreview;
        setApprovalPreview(dataUrl);
        try {
          const updated = await changeMyPageImages({ stampImage: dataUrl });
          updateUserImages({
            profileImage: updated.profileImage,
            signatureImage: updated.signatureImage,
            stampImage: updated.stampImage,
          });
          setNoticeMessage('결재 도장 이미지가 저장되었습니다.');
          return;
        } catch {
          setApprovalPreview(previousApprovalPreview);
          throw new Error('결재 도장 이미지 저장에 실패했습니다.');
        }
      }
    } catch {
      setNoticeMessage('이미지를 저장하는 중 오류가 발생했습니다.');
    }
  };

  return (
    <Stack spacing={2.5} data-testid="account-my-page">
      <PageHeader
        title="내 정보 관리"
        description="프로필 이미지와 결재 서명/도장 이미지를 관리합니다."
        useMenuMetadata={false}
        showGroupLabel={false}
      />

      {noticeMessage ? <Alert severity="info">{noticeMessage}</Alert> : null}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2}>
            <MyPageProfileCard
              profilePreview={profilePreview}
              initials={initials}
              visibleName={visibleName}
              visibleRole={visibleRole}
              onProfileImageChange={(event) => {
                void handleFileChange('profileImage', event);
              }}
            />

            <MyPageApprovalCard
              approvalPreview={approvalPreview}
              onApprovalImageChange={(event) => {
                void handleFileChange('approvalImage', event);
              }}
            />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <MyPageAccountInfoPanel
            visibleName={visibleName}
            visibleEmail={visibleEmail}
            visibleDepartment={visibleDepartment}
            visibleRole={visibleRole}
            resolvedLoginId={resolvedLoginId}
            isLoading={myPageQuery.isLoading}
            isError={myPageQuery.isError}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}
