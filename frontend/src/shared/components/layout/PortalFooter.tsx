import { Box, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export function PortalFooter() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const footerLogoSrc = isDarkMode
    ? '/f1foodlink_wh.png'
    : '/f1foodlink_midd.png';
  const companyInfoLines = [
    '본점 · 경기도 화성시 동탄순환대로 823, 611호 (영천동 에이팩시티) | TEL 031)5183-5341(대표) | FAX 031)5183-5340',
    '세종 지사 · 세종특별자치시 집현중앙7로 6, BS 1001호(집현동, 세종시 지식산업센터) (중부지점)',
    'E-MAIL : info@f1soft.co.kr | 대표: 오승호 | 사업자등록번호: 135-86-06250',
    'COPYRIGHT(C) F1soft CO.,LTD. ALL RIGHTS RESERVED.',
  ];

  return (
    <Box
      component="footer"
      data-testid="portal-footer"
      sx={{
        mt: 'auto',
        px: { xs: 2, md: 3 },
        py: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Stack spacing={{ xs: 1.2, md: 1.35 }} alignItems="flex-start">
        <Box
          component="img"
          src={footerLogoSrc}
          alt="F1FoodLink"
          sx={{
            display: 'block',
            width: 84,
            height: 14,
            objectFit: 'contain',
            imageRendering: '-webkit-optimize-contrast',
            opacity: isDarkMode ? 0.95 : 0.92,
          }}
        />
        <Stack spacing={0.3} data-testid="portal-footer-company-info">
          {companyInfoLines.map((line) => (
            <Typography
              key={line}
              variant="caption"
              color="text.secondary"
              sx={{
                lineHeight: 1.45,
                fontSize: { xs: 10.5, md: 11.5 },
                wordBreak: 'keep-all',
              }}
            >
              {line}
            </Typography>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
