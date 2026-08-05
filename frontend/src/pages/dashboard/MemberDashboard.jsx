import { Paper, Typography, Box } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

export default function MemberDashboard() {
  const { user } = useAuth();
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        வணக்கம், {user?.name || 'உறுப்பினர்'} 🙏
      </Typography>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Typography color="text.secondary">
          உங்கள் பதிவு விவரங்கள் மற்றும் தேடல் அம்சங்கள் அடுத்த கட்டங்களில் இங்கே சேர்க்கப்படும்.
        </Typography>
      </Paper>
    </Box>
  );
}
