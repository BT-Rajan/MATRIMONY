import { useCallback, useEffect, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  IconButton,
  MenuItem,
  Pagination,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined';
import { getMasterConfig, MASTER_CONFIG } from '../../../config/masterConfig';
import { masterService } from '../../../services/masterService';
import { useToast } from '../../../contexts/ToastContext';
import Loader from '../../../components/common/Loader';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import MasterFormDialog from './MasterFormDialog';

const PER_PAGE = 10;

export default function MasterListPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const config = getMasterConfig(slug);

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, total_pages: 1 });
  const [search, setSearch] = useState('');
  const [parentId, setParentId] = useState('');
  const [parentOptions, setParentOptions] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(() => {
    if (!config) return;
    setLoading(true);
    masterService
      .list(slug, { search, parentId: parentId || undefined, page, perPage: PER_PAGE })
      .then((res) => {
        setItems(res.data.items);
        setMeta(res.data.meta);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [slug, search, parentId, page]);

  useEffect(() => {
    setPage(1);
    setSearch('');
    setParentId('');
  }, [slug]);

  useEffect(() => {
    if (config?.type === 'hierarchical') {
      masterService.options(config.parentSlug).then(setParentOptions).catch(() => setParentOptions([]));
    } else {
      setParentOptions([]);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  if (!config) {
    return <Navigate to="/admin/masters" replace />;
  }

  const openCreate = () => {
    setEditingRow(null);
    setFormOpen(true);
  };
  const openEdit = (row) => {
    setEditingRow(row);
    setFormOpen(true);
  };
  const handleSaved = () => {
    setFormOpen(false);
    toast.success('சேமிக்கப்பட்டது');
    load();
  };

  const confirmDelete = async () => {
    try {
      await masterService.remove(slug, deleteTarget.id);
      toast.success('நீக்கப்பட்டது');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.message);
      setDeleteTarget(null);
    }
  };

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <MuiLink component="button" underline="hover" onClick={() => navigate('/admin/masters')}>
          மாஸ்டர் தரவு
        </MuiLink>
        <Typography color="text.primary">{config.labelTa}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">
          {config.labelTa} <Typography component="span" color="text.secondary" variant="body2">({config.labelEn})</Typography>
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          புதிதாக சேர்
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            size="small"
            placeholder="தேடு..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            sx={{ minWidth: 220 }}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }
            }}
          />
          {config.type === 'hierarchical' && (
            <TextField
              size="small"
              select
              label={`${config.parentLabelTa} வடிகட்டி`}
              value={parentId}
              onChange={(e) => {
                setPage(1);
                setParentId(e.target.value);
              }}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">அனைத்தும்</MenuItem>
              {parentOptions.map((opt) => (
                <MenuItem key={opt.id} value={opt.id}>
                  {opt.name_tamil} ({opt.name_english})
                </MenuItem>
              ))}
            </TextField>
          )}
        </Box>

        {loading ? (
          <Loader />
        ) : items.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">தரவு எதுவும் இல்லை</Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>தமிழ் பெயர்</TableCell>
                <TableCell>ஆங்கில பெயர்</TableCell>
                {config.type === 'hierarchical' && <TableCell>{config.parentLabelTa}</TableCell>}
                {config.type === 'event' && <TableCell>தேதி / இடம்</TableCell>}
                <TableCell align="center">நிலை</TableCell>
                <TableCell align="right">செயல்கள்</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.name_tamil}</TableCell>
                  <TableCell>{row.name_english}</TableCell>
                  {config.type === 'hierarchical' && (
                    <TableCell>
                      {parentOptions.find((p) => p.id === row[config.parentColumn])?.name_tamil || '-'}
                    </TableCell>
                  )}
                  {config.type === 'event' && (
                    <TableCell>
                      {row.event_date || '-'} {row.venue ? `• ${row.venue}` : ''}
                    </TableCell>
                  )}
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={row.is_active ? 'செயலில்' : 'செயலிழந்தது'}
                      color={row.is_active ? 'success' : 'default'}
                      variant={row.is_active ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(row)}>
                      <EditOutlined fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => setDeleteTarget(row)}>
                      <DeleteOutline fontSize="small" color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
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

      <MasterFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        config={config}
        editingRow={editingRow}
        lockedParentId={config.type === 'hierarchical' ? parentId || null : null}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="நீக்க வேண்டுமா?"
        message={deleteTarget ? `"${deleteTarget.name_tamil}" ஐ நீக்க வேண்டுமா? இந்த செயலை மாற்ற முடியாது.` : ''}
        confirmLabel="நீக்கு"
        confirmColor="error"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </Box>
  );
}

export { MASTER_CONFIG };
