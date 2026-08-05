import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, p: 3, textAlign: 'center' }}>
      <Typography variant="h2" color="primary">404</Typography>
      <Typography variant="h6">இந்தப் பக்கம் கிடைக்கவில்லை</Typography>
      <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 1 }}>
        முகப்புக்குச் செல்க
      </Button>
    </Box>
  );
}
