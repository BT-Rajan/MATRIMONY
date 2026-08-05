import { Paper, Typography, Box, Grid } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const CARDS = [
  { label: 'மொத்த உறுப்பினர்கள்', value: '—' },
  { label: 'அனுமதிக்காக காத்திருப்பவை', value: '—' },
  { label: 'இந்த மாத பதிவுகள்', value: '—' },
  { label: 'வரவேற்பு நிலுவைத் தொகை', value: '—' },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        வணக்கம், {user?.name || user?.username || 'நிர்வாகி'} 🙏
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {CARDS.map((c) => (
          <Grid item xs={12} sm={6} md={3} key={c.label}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {c.label}
              </Typography>
              <Typography variant="h4" sx={{ mt: 0.5 }}>
                {c.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Typography color="text.secondary">
          புள்ளிவிவரங்கள், அறிக்கைகள் மற்றும் மாஸ்டர் தரவு மேலாண்மை அடுத்த கட்டங்களில் இங்கே சேர்க்கப்படும்.
        </Typography>
      </Paper>
    </Box>
  );
}
