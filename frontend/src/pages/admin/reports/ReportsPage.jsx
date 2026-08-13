import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  LinearProgress,
} from '@mui/material';
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined';
import { statsService } from '../../../services/statsService';
import { downloadCsv } from '../../../utils/csvExport';
import { STATUS_LABELS } from '../../../utils/memberStatus';

const TABS = [
  { key: 'status', label: 'நிலைவாரியாக' },
  { key: 'daily', label: 'தினசரி' },
  { key: 'monthly', label: 'மாதாந்திர' },
  { key: 'payments', label: 'கட்டணங்கள்' },
];

export default function ReportsPage() {
  const [tab, setTab] = useState('status');

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        அறிக்கைகள்
      </Typography>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: 'divider' }}>
          {TABS.map((t) => (
            <Tab key={t.key} value={t.key} label={t.label} />
          ))}
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tab === 'status' && <StatusReport />}
          {tab === 'daily' && <TrendReport period="daily" title="தினசரி பதிவுகள் (30 நாட்கள்)" />}
          {tab === 'monthly' && <TrendReport period="monthly" title="மாதாந்திர பதிவுகள் (12 மாதங்கள்)" />}
          {tab === 'payments' && <PaymentsReport />}
        </Box>
      </Paper>
    </Box>
  );
}

function StatusReport() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    statsService.overview().then((res) => setCounts(res.data));
  }, []);

  if (!counts) return <LinearProgress />;

  return (
    <Grid container spacing={2}>
      {Object.entries(STATUS_LABELS).map(([status, { label, color }]) => (
        <Grid item xs={12} sm={6} md={4} key={status}>
          <Paper
            variant="outlined"
            sx={{ p: 2.5, borderRadius: 3, cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}
            onClick={() => navigate('/admin/members', { state: { filters: { status } } })}
          >
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h4" sx={{ mt: 0.5 }} color={`${color}.main`}>
              {counts.by_status[status] ?? 0}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

function TrendReport({ period, title }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    statsService
      .trend(period)
      .then((res) => setRows(res.data))
      .finally(() => setLoading(false));
  }, [period]);

  const handleExport = () => {
    downloadCsv(`registrations-${period}.csv`, ['Period', 'Count'], rows.map((r) => [r.bucket, r.count]));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Button size="small" variant="outlined" startIcon={<FileDownloadOutlined />} onClick={handleExport} disabled={loading || rows.length === 0}>
          CSV ஏற்றுமதி
        </Button>
      </Box>
      {loading ? (
        <LinearProgress />
      ) : rows.length === 0 ? (
        <Typography color="text.secondary">தரவு இல்லை</Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>தேதி</TableCell>
              <TableCell align="right">பதிவுகள்</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.bucket} hover>
                <TableCell>{r.bucket}</TableCell>
                <TableCell align="right">{r.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}

function PaymentsReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsService
      .payments()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LinearProgress />;
  if (!data) return null;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="body2" color="text.secondary">
            கட்டணம் செலுத்தியவர்கள்
          </Typography>
          <Typography variant="h4">{data.paid_count}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="body2" color="text.secondary">
            மொத்த தொகை
          </Typography>
          <Typography variant="h4">₹{Number(data.total_amount).toLocaleString('en-IN')}</Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}
