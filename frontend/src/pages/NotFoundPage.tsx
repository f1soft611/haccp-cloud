import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f3f3f5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        px: 2,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 540,
          textAlign: 'center',
          mt: { xs: -8, sm: -10 },
        }}
      >
        <Typography
          component="h1"
          variant="h6"
          sx={{
            fontWeight: 700,
            color: '#0f172a',
            mb: 1,
            fontSize: { xs: '1rem', sm: '1.2rem' },
            lineHeight: 1.5,
          }}
        >
          요청하신 페이지를 찾을 수 없습니다
        </Typography>
        <Typography
          sx={{
            color: '#9aa0a6',
            fontWeight: 500,
            fontSize: { xs: '0.95rem', sm: '1rem' },
            lineHeight: 1.7,
            mb: 3,
          }}
        >
          주소가 변경되었거나 페이지가 삭제되었을 수 있습니다.
        </Typography>
        <Button
          variant="contained"
          onClick={handleGoBack}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            px: 3,
            py: 1,
            borderRadius: '10px',
            bgcolor: '#000000',
            color: '#ffffff',
            boxShadow: 'none',
            '&:hover': {
              bgcolor: '#151515',
              boxShadow: 'none',
            },
          }}
        >
          돌아가기
        </Button>
      </Box>

      <Typography
        sx={{
          position: 'absolute',
          bottom: 20,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: '#9aa0a6',
          fontSize: { xs: '0.72rem', sm: '0.8rem' },
        }}
      >
        © 2026 HACCP Cloud · F1soft
      </Typography>
    </Box>
  );
}
