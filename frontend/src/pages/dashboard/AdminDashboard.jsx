import { useEffect, useState } from 'react';
import { Paper, Typography, Box, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { adminMemberService } from '../../services/adminMemberService';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ total: null, pending: null, approved: null, verified: null });

  useEffect(() => {
    Promise.all([
      adminMemberService.list({ page: 1, perPage: 1 }),
      adminMemberService.list({ page: 1, perPage: 1, status: 'pending_approval' }),
      adminMemberService.list({ page: 1, perPage: 1, status: 'approved' }),
      adminMemberService.list({ page: 1, perPage: 1, isVerified: 1 }),
    ])
      .then(([total, pending, approved, verified]) => {
        setCounts({
          total: total.data.meta.total,
          pending: pending.data.meta.total,
          approved: approved.data.meta.total,
          verified: verified.data.meta.total,
        });
      })
      .catch(() => {});
  }, []);

  const CARDS = [
    { label: 'மொத்த உறுப்பினர்கள்', value: counts.total, path: '/admin/members' },
    { label: 'அனுமதிக்காக காத்திருப்பவை', value: counts.pending, path: '/admin/members?status=pending_approval' },
    { label: 'அனுமதிக்கப்பட்டவை', value: counts.approved, path: '/admin/members?status=approved' },
    { label: 'சரிபார்க்கப்பட்டவை', value: counts.verified, path: '/admin/members' },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        வணக்கம், {user?.name || user?.username || 'நிர்வாகி'} 🙏
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {CARDS.map((c) => (
          <Grid item xs={12} sm={6} md={3} key={c.label}>
            <Paper
              variant="outlined"
              sx={{ p: 2.5, borderRadius: 3, cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}
              onClick={() => navigate('/admin/members')}
            >
              <Typography variant="body2" color="text.secondary">
                {c.label}
              </Typography>
              <Typography variant="h4" sx={{ mt: 0.5 }}>
                {c.value ?? '—'}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Typography color="text.secondary">
          விரிவான புள்ளிவிவரங்கள், வரைபடங்கள் மற்றும் அறிக்கைகள் அடுத்த கட்டங்களில் இங்கே சேர்க்கப்படும்.
        </Typography>
      </Paper>
    </Box>
  );
}
