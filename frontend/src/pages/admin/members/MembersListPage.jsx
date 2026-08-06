import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  MenuItem,
  Pagination,
  Avatar,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined';
import { adminMemberService } from '../../../services/adminMemberService';
import { useToast } from '../../../contexts/ToastContext';
import Loader from '../../../components/common/Loader';
import { STATUS_LABELS, GENDER_LABELS } from '../../../utils/memberStatus';

const PER_PAGE = 15;

export default function MembersListPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, total_pages: 1 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [gender, setGender] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    adminMemberService
      .list({ search, status, gender, page, perPage: PER_PAGE })
      .then((res) => {
        setItems(res.data.items);
        setMeta(res.data.meta);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [search, status, gender, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        உறுப்பினர்கள்
      </Typography>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            size="small"
            placeholder="பதிவு எண், பெயர், மொபைல், மின்னஞ்சல்..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            sx={{ minWidth: 260 }}
          />
          <TextField
            size="small"
            select
            label="நிலை"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">அனைத்தும்</MenuItem>
            {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
              <MenuItem key={val} value={val}>{label}</MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            select
            label="பாலினம்"
            value={gender}
            onChange={(e) => {
              setPage(1);
              setGender(e.target.value);
            }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">அனைத்தும்</MenuItem>
            <MenuItem value="groom">மணமகன்</MenuItem>
            <MenuItem value="bride">மணமகள்</MenuItem>
          </TextField>
        </Box>

        {loading ? (
          <Loader />
        ) : items.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">உறுப்பினர்கள் இல்லை</Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>பதிவு எண்</TableCell>
                <TableCell>பெயர்</TableCell>
                <TableCell>பாலினம்</TableCell>
                <TableCell>மொபைல்</TableCell>
                <TableCell align="center">நிலை</TableCell>
                <TableCell align="center">சரிபார்ப்பு</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((row) => {
                const statusInfo = STATUS_LABELS[row.status] || { label: row.status, color: 'default' };
                return (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/admin/members/${row.id}`)}
                  >
                    <TableCell sx={{ width: 48 }}>
                      <Avatar
                        src={row.photo_path ? apiFileUrl(row.photo_path) : undefined}
                        sx={{ width: 32, height: 32 }}
                      >
                        {row.name_english?.slice(0, 1)}
                      </Avatar>
                    </TableCell>
                    <TableCell>{row.registration_number}</TableCell>
                    <TableCell>
                      {row.name_tamil}
                      <Typography variant="caption" display="block" color="text.secondary">
                        {row.name_english}
                      </Typography>
                    </TableCell>
                    <TableCell>{GENDER_LABELS[row.gender] || row.gender}</TableCell>
                    <TableCell>{row.mobile}</TableCell>
                    <TableCell align="center">
                      <Chip size="small" label={statusInfo.label} color={statusInfo.color} variant={statusInfo.color === 'default' ? 'outlined' : 'filled'} />
                    </TableCell>
                    <TableCell align="center">
                      {!!row.is_verified && (
                        <Tooltip title="சரிபார்க்கப்பட்டது">
                          <VerifiedOutlined fontSize="small" color="primary" />
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
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

// Uploaded files are served by the backend under /uploads/<path>; the API
// base already points at .../backend/api, so strip the trailing /api.
export function apiFileUrl(relativePath) {
  if (!relativePath) return undefined;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost/matrimony/backend/api').replace(/\/api\/?$/, '');
  return `${base}/uploads/${relativePath}`;
}
