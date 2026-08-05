import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';

export default function RegisterComingSoon() {
  const navigate = useNavigate();
  return (
    <AuthLayout title="புதிய பதிவு" subtitle="5-படி பதிவு படிவம் விரைவில்">
      <Box sx={{ textAlign: 'center' }}>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          சுய-பதிவு வழிகாட்டி (Pass 3) அடுத்த கட்டத்தில் உருவாக்கப்படும்.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/login')}>
          உள்நுழைவு பக்கத்திற்குத் திரும்பு
        </Button>
      </Box>
    </AuthLayout>
  );
}
