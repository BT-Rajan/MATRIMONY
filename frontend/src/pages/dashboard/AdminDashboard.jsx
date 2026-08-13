import { useEffect, useState } from 'react';
import { Paper, Typography, Box, Grid, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { statsService } from '../../services/statsService';
import Loader from '../../components/common/Loader';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([statsService.overview(), statsService.trend('daily')])
      .then(([ov, tr]) => {
        setOverview(ov.data);
        setTrend(tr.data.map((r) => ({ label: r.bucket.slice(5), count: r.count })));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !overview) return <Loader />;

  const CARDS = [
    { label: 'மொத்த உறுப்பினர்கள்', value: overview.total, filters: {} },
    { label: 'அனுமதிக்காக காத்திருப்பவை', value: overview.by_status.pending_approval, filters: { status: 'pending_approval' } },
    { label: 'அனுமதிக்கப்பட்டவை', value: overview.by_status.approved, filters: { status: 'approved' } },
    { label: 'சரிபார்க்கப்பட்டவை', value: overview.verified, filters: { isVerified: 1 } },
    { label: 'இன்று சேர்ந்தவை', value: overview.today, filters: {} },
    { label: 'இந்த மாதம்', value: overview.this_month, filters: {} },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        வணக்கம், {user?.name || user?.username || 'நிர்வாகி'} 🙏
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {CARDS.map((c) => (
          <Grid item xs={12} sm={6} md={2} key={c.label}>
            <Paper
              variant="outlined"
              sx={{ p: 2.5, borderRadius: 3, cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}
              onClick={() => navigate('/admin/members', { state: { filters: c.filters } })}
            >
              <Typography variant="body2" color="text.secondary">
                {c.label}
              </Typography>
              <Typography variant="h4" sx={{ mt: 0.5 }}>
                {c.value ?? 0}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              பதிவுகள் — கடந்த 30 நாட்கள்
            </Typography>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe0" />
                <XAxis dataKey="label" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <ChartTooltip />
                <Line type="monotone" dataKey="count" stroke="#7A1F3D" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              நிலை வாரியாக
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip label={`வரைவு: ${overview.by_status.draft}`} variant="outlined" />
              <Chip label={`காத்திருப்பு: ${overview.by_status.pending_approval}`} color="warning" variant="outlined" />
              <Chip label={`அனுமதிக்கப்பட்டது: ${overview.by_status.approved}`} color="success" variant="outlined" />
              <Chip label={`நிராகரிக்கப்பட்டது: ${overview.by_status.rejected}`} color="error" variant="outlined" />
              <Chip label={`முடக்கப்பட்டது: ${overview.by_status.blocked}`} variant="outlined" />
              <Chip label={`காப்பகப்படுத்தப்பட்டது: ${overview.by_status.archived}`} variant="outlined" />
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                மணமகன்: {overview.by_gender.groom} • மணமகள்: {overview.by_gender.bride}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
