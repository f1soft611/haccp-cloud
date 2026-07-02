import { Alert, Button, Paper, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useState } from 'react';
import { createDepartment } from '../../../services/organization/departmentsService';
import {
  completeFirstSetup,
  getFirstSetupStatus,
} from '../../../services/organization/firstLoginSetupService';
import { createUser } from '../../../services/organization/usersService';
import { useAuthStore } from '../../../shared/store/authStore';
import { APP_LABELS } from '../../../shared/constants/labels';
import { TenantFirstSetupUserForm } from './components/first-setup/TenantFirstSetupUserForm';
import { TenantFirstSetupDepartmentForm } from './components/first-setup/TenantFirstSetupDepartmentForm';

export function TenantFirstLoginSetupPage() {
  const queryClient = useQueryClient();
  const tenantCode = useAuthStore((state) => state.tenantCode);
  const markOnboardingCompleted = useAuthStore(
    (state) => state.markOnboardingCompleted,
  );
  const isTenantCodeMissing = tenantCode.trim().length === 0;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('품질관리팀');
  const [departmentName, setDepartmentName] = useState('');
  const [completionError, setCompletionError] = useState<string | null>(null);

  const statusQuery = useQuery({
    queryKey: ['first-login-setup-status', tenantCode],
    queryFn: () => getFirstSetupStatus(tenantCode),
    enabled: !isTenantCodeMissing,
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      setName('');
      setEmail('');
      void queryClient.invalidateQueries({
        queryKey: ['first-login-setup-status', tenantCode],
      });
    },
  });

  const createDepartmentMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      setDepartmentName('');
      void queryClient.invalidateQueries({
        queryKey: ['first-login-setup-status', tenantCode],
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (targetTenantCode: string) => {
      const response = await completeFirstSetup(targetTenantCode);
      const isCompleted =
        response.completed === true ||
        response.onboardingRequired === false ||
        response.onboardingStatus === 'COMPLETED';

      if (!isCompleted) {
        throw new Error(APP_LABELS.message.tenantFirstSetupCompleteFailed);
      }

      return response;
    },
    onSuccess: () => {
      setCompletionError(null);
      markOnboardingCompleted();
    },
    onError: (error) => {
      if (isAxiosError<{ message?: string }>(error)) {
        setCompletionError(
          error.response?.data?.message ||
            APP_LABELS.message.tenantFirstSetupCompleteFailed,
        );
        return;
      }

      setCompletionError(APP_LABELS.message.tenantFirstSetupCompleteFailed);
    },
  });

  const userCount = statusQuery.data?.userCount ?? 0;
  const departmentCount = statusQuery.data?.departmentCount ?? 0;
  const canCompleteSetup = userCount >= 1 && departmentCount >= 1;

  const handleCreateUser = () => {
    if (isTenantCodeMissing) {
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedDepartment = department.trim();

    if (!trimmedName || !trimmedEmail || !trimmedDepartment) {
      return;
    }

    createUserMutation.mutate({
      tenantCode,
      name: trimmedName,
      email: trimmedEmail,
      department: trimmedDepartment,
      roleCode: 'TENANT_USER',
    });
  };

  const handleCreateDepartment = () => {
    if (isTenantCodeMissing) {
      return;
    }

    const trimmedDepartmentName = departmentName.trim();
    if (!trimmedDepartmentName) {
      return;
    }

    createDepartmentMutation.mutate({
      tenantCode,
      name: trimmedDepartmentName,
      parentId: null,
      sortOrder: 0,
    });
  };

  const handleCompleteSetup = () => {
    setCompletionError(null);

    if (isTenantCodeMissing) {
      setCompletionError(APP_LABELS.message.tenantFirstSetupMissingTenantCode);
      return;
    }

    if (!canCompleteSetup) {
      setCompletionError('사용자 1명 이상, 부서 1개 이상이 필요합니다.');
      return;
    }

    completeMutation.mutate(tenantCode);
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 720 }} data-testid="tenant-first-setup-route">
      <Stack spacing={2}>
        <Typography variant="h4">
          {APP_LABELS.pageTitle.tenantFirstSetup}
        </Typography>
        <Typography color="text.secondary">
          {APP_LABELS.message.tenantFirstSetupGuide}
        </Typography>

        {isTenantCodeMissing && (
          <Alert severity="warning">
            {APP_LABELS.message.tenantFirstSetupMissingTenantCode}
          </Alert>
        )}

        {statusQuery.isError && (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  void statusQuery.refetch();
                }}
              >
                {APP_LABELS.action.retry}
              </Button>
            }
          >
            {APP_LABELS.message.tenantFirstSetupStatusError}
          </Alert>
        )}

        {completeMutation.isSuccess && (
          <Alert severity="success">
            {APP_LABELS.message.tenantFirstSetupCompleted}
          </Alert>
        )}

        {completionError && <Alert severity="error">{completionError}</Alert>}

        <Typography>사용자 {userCount} / 1</Typography>
        <Typography>부서 {departmentCount} / 1</Typography>

        <TenantFirstSetupUserForm
          name={name}
          email={email}
          department={department}
          pending={createUserMutation.isPending}
          onNameChange={setName}
          onEmailChange={setEmail}
          onDepartmentChange={setDepartment}
          onSubmit={handleCreateUser}
        />

        <TenantFirstSetupDepartmentForm
          departmentName={departmentName}
          pending={createDepartmentMutation.isPending}
          onDepartmentNameChange={setDepartmentName}
          onSubmit={handleCreateDepartment}
        />

        <Button
          variant="contained"
          onClick={handleCompleteSetup}
          disabled={
            isTenantCodeMissing ||
            !canCompleteSetup ||
            completeMutation.isPending ||
            statusQuery.isPending
          }
        >
          {APP_LABELS.action.completeFirstSetup}
        </Button>
      </Stack>
    </Paper>
  );
}
