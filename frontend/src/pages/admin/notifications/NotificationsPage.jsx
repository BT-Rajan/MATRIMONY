import { useCallback, useEffect, useState, Fragment } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  MenuItem,
  TextField,
  Pagination,
  Collapse,
  IconButton,
  Grid,
  Alert,
} from '@mui/material';
import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined';
import ExpandLessOutlined from '@mui/icons-material/ExpandLessOutlined';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import SmsOutlined from '@mui/icons-material/SmsOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { notificationService } from '../../../services/notificationService';
import { useToast } from '../../../contexts/ToastContext';
import Loader from '../../../components/common/Loader';

const PER_PAGE = 20;

const CHANNEL_ICONS = {
  email: <EmailOutlined fontSize="small" />,
  sms: <SmsOutlined fontSize="small" />,
  whatsapp: <WhatsAppIcon fontSize="small" />,
};

const STATUS_COLORS = { sent: 'success', failed: 'error', skipped: 'default' };
const STATUS_LABELS_TA = { sent: 'அனுப்பப்பட்டது', failed: 'தோல்வி', skipped: 'தவிர்க்கப்பட்டது' };

const EVENT_LABELS_TA = {
  registration_completed: 'பதிவு முடிக்கப்பட்டது',
  member_approved: 'அனுமதிக்கப்பட்டது',
  member_rejected: 'நிராகரிக்கப்பட்டது',
};

export default function NotificationsPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, total_pages: 1 });
  const [channels, setChannels] = useState(null);
  const [counts, setCounts] = useState(null);
  const [status, setStatus] = useState('');
  const [channel, setChannel] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    notificationService
      .list({ status, channel, page, perPage: PER_PAGE })
      .then((res) => {
        setItems(res.data.items);
        setMeta(res.data.meta);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [status, channel, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    notificationService.channelStatus().then((res) => setChannels(res.data)).catch(() => {});
    notificationService.counts().then((res) => setCounts(res.data)).catch(() => {});
  }, []);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        அறிவிப்புகள்
      </Typography>

      {channels && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {[
            ['email', 'மின்னஞ்சல்'],
            ['sms', 'SMS'],
            ['whatsapp', 'வாட்ஸ்அப்'],
          ].map(([key, label]) => (
            <Grid item xs={12} sm={4} key={key}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {CHANNEL_ICONS[key]}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">{label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {channels[key].enabled && channels[key].configured
                      ? 'இயக்கத்தில் உள்ளது'
                      : channels[key].configured
                      ? 'கட்டமைக்கப்பட்டது, ஆனால் முடக்கப்பட்டுள்ளது'
                      : 'கட்டமைக்கப்படவில்லை'}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={channels[key].enabled && channels[key].configured ? 'ON' : 'OFF'}
                  color={channels[key].enabled && channels[key].configured ? 'success' : 'default'}
                />
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {channels && !channels.email.configured && !channels.sms.configured && !channels.whatsapp.configured && (
        <Alert severity="info" sx={{ mb: 2 }}>
          எந்த அறிவிப்பு சேனலும் இன்னும் கட்டமைக்கப்படவில்லை. backend/.env இல் SMTP / SMS / WhatsApp அமைப்புகளைச் சேர்க்கவும் —
          விவரங்களுக்கு docs/SETUP.md ஐப் பார்க்கவும்.
        </Alert>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField size="small" select label="நிலை" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} sx={{ minWidth: 160 }}>
              <MenuItem value="">அனைத்தும்</MenuItem>
              <MenuItem value="sent">அனுப்பப்பட்டது</MenuItem>
              <MenuItem value="failed">தோல்வி</MenuItem>
              <MenuItem value="skipped">தவிர்க்கப்பட்டது</MenuItem>
            </TextField>
            <TextField size="small" select label="சேனல்" value={channel} onChange={(e) => { setPage(1); setChannel(e.target.value); }} sx={{ minWidth: 160 }}>
              <MenuItem value="">அனைத்தும்</MenuItem>
              <MenuItem value="email">மின்னஞ்சல்</MenuItem>
              <MenuItem value="sms">SMS</MenuItem>
              <MenuItem value="whatsapp">வாட்ஸ்அப்</MenuItem>
            </TextField>
          </Box>
          {counts && (
            <Typography variant="body2" color="text.secondary">
              அனுப்பப்பட்டது: {counts.sent} • தோல்வி: {counts.failed} • தவிர்க்கப்பட்டது: {counts.skipped}
            </Typography>
          )}
        </Box>

        {loading ? (
          <Loader />
        ) : items.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">அறிவிப்புகள் இல்லை</Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>உறுப்பினர்</TableCell>
                <TableCell>நிகழ்வு</TableCell>
                <TableCell>சேனல்</TableCell>
                <TableCell>பெறுநர்</TableCell>
                <TableCell align="center">நிலை</TableCell>
                <TableCell>தேதி</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((n) => (
                <Fragment key={n.id}>
                  <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === n.id ? null : n.id)}>
                    <TableCell sx={{ width: 40 }}>
                      <IconButton size="small">
                        {expandedId === n.id ? <ExpandLessOutlined fontSize="small" /> : <ExpandMoreOutlined fontSize="small" />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      {n.name_tamil}
                      <Typography variant="caption" display="block" color="text.secondary">
                        {n.registration_number}
                      </Typography>
                    </TableCell>
                    <TableCell>{EVENT_LABELS_TA[n.event_type] || n.event_type}</TableCell>
                    <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {CHANNEL_ICONS[n.channel]} {n.channel}
                    </TableCell>
                    <TableCell>{n.recipient}</TableCell>
                    <TableCell align="center">
                      <Chip size="small" label={STATUS_LABELS_TA[n.status]} color={STATUS_COLORS[n.status]} variant={n.status === 'skipped' ? 'outlined' : 'filled'} />
                    </TableCell>
                    <TableCell>{n.created_at}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
                      <Collapse in={expandedId === n.id}>
                        <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                          {n.subject && (
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {n.subject}
                            </Typography>
                          )}
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
                            {n.message}
                          </Typography>
                          {n.error_message && (
                            <Typography variant="caption" color="error">
                              {n.error_message}
                            </Typography>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              ))}
            </TableBody>
          </Table>
        )}

        {meta.total_pages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <Pagination count={meta.total_pages} page={page} onChange={(_e, p) => setPage(p)} color="primary" />
          </Box>
        )}
      </Paper>
    </Box>
  );
}
