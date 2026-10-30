import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useState, type ChangeEvent } from 'react';
import { extractApiErrorMessage } from '../../../../services/api/errorMessage';
import {
    updatePlatformTenant,
    type PlatformTenantManagementItem,
} from '../../../../services/platform-admin/tenants/platformTenantManagementService';

const MAX_LOGO_FILE_SIZE = 2 * 1024 * 1024;

type Props = {
    open: boolean;
    tenant: PlatformTenantManagementItem;
    onClose: () => void;
    onSaved: () => void;
};

function readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ''));
        reader.onerror = () => reject(new Error('로고 파일을 읽을 수 없습니다.'));
        reader.readAsDataURL(file);
    });
}

export function PlatformTenantEditDialog({ open, tenant, onClose, onSaved }: Props) {
    const [companyName, setCompanyName] = useState(tenant.companyName ?? '');
    const [corporateNumber, setCorporateNumber] = useState(tenant.corporateNumber ?? '');
    const [businessType, setBusinessType] = useState(tenant.businessType ?? '');
    const [businessCategory, setBusinessCategory] = useState(tenant.businessCategory ?? '');
    const [registrationDate, setRegistrationDate] = useState(tenant.registrationDate ?? '');
    // undefined = 로고 변경 없음, string = 새 로고
    const [newLogo, setNewLogo] = useState<string | undefined>(undefined);
    const [removeLogo, setRemoveLogo] = useState(false);
    const [validationMessage, setValidationMessage] = useState('');

    const previewLogo = removeLogo ? undefined : (newLogo ?? tenant.logoImage);

    const saveMutation = useMutation({
        mutationFn: () =>
            updatePlatformTenant(tenant.tenantCode, {
                companyName: companyName.trim(),
                corporateNumber: corporateNumber.trim() || undefined,
                businessType: businessType.trim(),
                businessCategory: businessCategory.trim(),
                registrationDate: registrationDate || undefined,
                logoImage: removeLogo ? undefined : newLogo,
                removeLogo,
            }),
        onSuccess: onSaved,
    });

    const handleLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) {
            return;
        }
        if (!file.type.startsWith('image/')) {
            setValidationMessage('이미지 파일만 업로드할 수 있습니다.');
            return;
        }
        if (file.size > MAX_LOGO_FILE_SIZE) {
            setValidationMessage('로고 파일 크기는 2MB 이하만 가능합니다.');
            return;
        }
        try {
            setNewLogo((await readAsDataUrl(file)) || undefined);
            setRemoveLogo(false);
            setValidationMessage('');
        } catch {
            setValidationMessage('로고 파일을 읽는 중 오류가 발생했습니다.');
        }
    };

    const handleRemoveLogo = () => {
        setNewLogo(undefined);
        setRemoveLogo(true);
    };

    const handleSave = () => {
        if (!companyName.trim() || !businessType.trim() || !businessCategory.trim()) {
            setValidationMessage('업체명, 업종, 업태는 필수입니다.');
            return;
        }
        setValidationMessage('');
        saveMutation.mutate();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>업체 정보 수정</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    {validationMessage ? <Alert severity="warning">{validationMessage}</Alert> : null}
                    {saveMutation.isError ? (
                        <Alert severity="error">
                            {extractApiErrorMessage(saveMutation.error, '업체 정보 수정 중 오류가 발생했습니다.')}
                        </Alert>
                    ) : null}

                    <Stack direction="row" spacing={2}>
                        <TextField label="업체 코드" value={tenant.tenantCode} disabled fullWidth />
                        <TextField
                            label="사업자번호"
                            value={tenant.businessRegistrationNumber ?? '-'}
                            disabled
                            fullWidth
                        />
                    </Stack>
                    <TextField label="관리자 이메일" value={tenant.adminEmail} disabled fullWidth />

                    <TextField
                        label="업체명"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        fullWidth
                    />
                    <TextField
                        label="법인번호"
                        value={corporateNumber}
                        onChange={(e) => setCorporateNumber(e.target.value)}
                        fullWidth
                    />
                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="업종"
                            value={businessType}
                            onChange={(e) => setBusinessType(e.target.value)}
                            required
                            fullWidth
                        />
                        <TextField
                            label="업태"
                            value={businessCategory}
                            onChange={(e) => setBusinessCategory(e.target.value)}
                            required
                            fullWidth
                        />
                    </Stack>
                    <TextField
                        label="개업일"
                        type="date"
                        value={registrationDate}
                        onChange={(e) => setRegistrationDate(e.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }}
                        fullWidth
                    />

                    <Stack spacing={1}>
                        <Typography variant="subtitle2">회사 로고</Typography>
                        {previewLogo ? (
                            <Box
                                component="img"
                                src={previewLogo}
                                alt="회사 로고 미리보기"
                                sx={{ width: 120, height: 120, objectFit: 'contain' }}
                            />
                        ) : (
                            <Typography variant="caption" color="text.secondary">
                                등록된 로고가 없습니다. 로고가 없으면 회사명 텍스트가 노출됩니다.
                            </Typography>
                        )}
                        <Stack direction="row" spacing={1}>
                            <Button variant="outlined" component="label">
                                로고 변경
                                <input
                                    hidden
                                    accept="image/*"
                                    type="file"
                                    onChange={(event) => {
                                        void handleLogoChange(event);
                                    }}
                                />
                            </Button>
                            <Button color="error" onClick={handleRemoveLogo} disabled={!previewLogo}>
                                로고 삭제
                            </Button>
                        </Stack>
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={saveMutation.isPending}>
                    취소
                </Button>
                <Button variant="contained" onClick={handleSave} disabled={saveMutation.isPending}>
                    저장
                </Button>
            </DialogActions>
        </Dialog>
    );
}