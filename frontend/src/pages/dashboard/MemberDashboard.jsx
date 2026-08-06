import { Paper, Typography, Box, Chip } from '@mui/material';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_LABELS = {
  pending_approval: { label: 'அனுமதிக்காக காத்திருக்கிறது', color: 'warning' },
  approved: { label: 'அனுமதிக்கப்பட்டது', color: 'success' },
  rejected: { label: 'நிராகரிக்கப்பட்டது', color: 'error' },
  blocked: { label: 'முடக்கப்பட்டது', color: 'default' },
  archived: { label: 'காப்பகப்படுத்தப்பட்டது', color: 'default' },
};

export default function MemberDashboard() {
  const { user } = useAuth();

  if ((user?.registration_step ?? 1) < 6) {
    return <Navigate to="/register" replace />;
  }

  const statusInfo = STATUS_LABELS[user?.status] || null;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 0.5 }}>
        வணக்கம், {user?.name || 'உறுப்பினர்'} 🙏
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        பதிவு எண்: {user?.registration_number}
        {statusInfo && (
          <Chip size="small" label={statusInfo.label} color={statusInfo.color} sx={{ ml: 1.5 }} />
        )}
      </Typography>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Typography color="text.secondary">
          உங்கள் பதிவு விவரங்கள், தேடல் மற்றும் பொருத்த அம்சங்கள் அடுத்த கட்டங்களில் இங்கே சேர்க்கப்படும்.
        </Typography>
      </Paper>
    </Box>
  );
}
