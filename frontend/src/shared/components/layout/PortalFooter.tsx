import { Box, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import styles from '../sharedComponents.module.css';
import { useSharedScope } from '../useSharedScope';

export function PortalFooter() {
  const scope = useSharedScope();
  const theme = useTheme();
  // eslint-disable-next-line no-restricted-syntax -- 로고 이미지 경로 분기 (색 아님)
  const isDarkMode = theme.palette.mode === 'dark';
  const footerLogoSrc = isDarkMode
    ? '/f1foodlink_wh.png'
    : '/f1foodlink_midd.png';
  const companyInfoLines = [
    '본점 · 경기도 화성시 동탄순환대로 823, 611호 (영천동 에이팩시티) | TEL 031)5183-5341(대표) | FAX 031)5183-5340 E-MAIL : info@f1soft.co.kr | 대표: 오승호 | 사업자등록번호: 135-86-06250',
    '세종 지사 · 세종특별자치시 집현중앙7로 6, BS 1001호(집현동, 세종시 지식산업센터) (중부지점)',
    'COPYRIGHT(C) F1soft CO.,LTD. ALL RIGHTS RESERVED.',
  ];

    return (
        <Box
            {...scope}
            className={`${scope.className} ${styles.portalFooter}`}
            component="footer"
            data-testid="portal-footer"
        >
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={{ xs: 1.2, md: 0 }}
                alignItems={{ xs: 'flex-start', md: 'center' }}
            >
                <Box className={styles.portalFooterLogoBox}>
                    <Box
                        component="img"
                        src={footerLogoSrc}
                        alt="F1FoodLink"
                        className={styles.portalFooterLogo}
                    />
                </Box>
                <Stack
                    spacing={0.1}
                    data-testid="portal-footer-company-info"
                    className={styles.portalFooterInfo}
                >
                    {companyInfoLines.map((line) => (
                        <Typography
                            key={line}
                            variant="caption"
                            className={`${styles.textSecondary} ${styles.portalFooterText}`}
                        >
                            {line}
                        </Typography>
                    ))}
                </Stack>
            </Stack>
        </Box>
    );
}