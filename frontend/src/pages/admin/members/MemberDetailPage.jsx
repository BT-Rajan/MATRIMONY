import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Avatar,
  Chip,
  Button,
  Stack,
  Divider,
  Breadcrumbs,
  Link as MuiLink,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined';
import BlockOutlined from '@mui/icons-material/BlockOutlined';
import ReplayOutlined from '@mui/icons-material/ReplayOutlined';
import ArchiveOutlined from '@mui/icons-material/ArchiveOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import MenuBookOutlined from '@mui/icons-material/MenuBookOutlined';
import { adminMemberService } from '../../../services/adminMemberService';
import { useToast } from '../../../contexts/ToastContext';
import Loader from '../../../components/common/Loader';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { STATUS_LABELS, GENDER_LABELS } from '../../../utils/memberStatus';
import { apiFileUrl } from './MembersListPage';

export default function MemberDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [confirmAction, setConfirmAction] = useState(null); // { type, title, message }
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminMemberService
      .show(id)
      .then((res) => setData(res.data))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loader fullscreen />;
  if (!data) return null;

  const { member } = data;
  const statusInfo = STATUS_LABELS[member.status] || { label: member.status, color: 'default' };

  const runAction = async (fn, successMsg) => {
    setBusy(true);
    try {
      await fn();
      toast.success(successMsg);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
      setConfirmAction(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('நிராகரிப்புக்கான காரணம் தேவை');
      return;
    }
    setBusy(true);
    try {
      await adminMemberService.reject(id, rejectReason.trim());
      toast.success('நிராகரிக்கப்பட்டது');
      setRejectOpen(false);
      setRejectReason('');
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <MuiLink component="button" underline="hover" onClick={() => navigate('/admin/members')}>
          உறுப்பினர்கள்
        </MuiLink>
        <Typography color="text.primary">{member.registration_number}</Typography>
      </Breadcrumbs>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Avatar sx={{ width: 64, height: 64 }}>
              {member.name_english?.slice(0, 1)}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {member.name_tamil} <Typography component="span" color="text.secondary">({member.name_english})</Typography>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {member.registration_number} • {GENDER_LABELS[member.gender] || member.gender}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip size="small" label={statusInfo.label} color={statusInfo.color} variant={statusInfo.color === 'default' ? 'outlined' : 'filled'} />
                {!!member.is_verified && <Chip size="small" icon={<VerifiedOutlined />} label="சரிபார்க்கப்பட்டது" color="primary" variant="outlined" />}
              </Stack>
            </Box>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {['pending_approval', 'rejected'].includes(member.status) && (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckCircleOutlined />}
                disabled={busy}
                onClick={() => runAction(() => adminMemberService.approve(id), 'அனுமதிக்கப்பட்டது')}
              >
                அனுமதி
              </Button>
            )}
            {member.status === 'pending_approval' && (
              <Button size="small" variant="outlined" color="error" startIcon={<CancelOutlined />} disabled={busy} onClick={() => setRejectOpen(true)}>
                நிராகரி
              </Button>
            )}
            {member.status !== 'draft' && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<VerifiedOutlined />}
                disabled={busy}
                onClick={() =>
                  runAction(
                    () => (member.is_verified ? adminMemberService.unverify(id) : adminMemberService.verify(id)),
                    member.is_verified ? 'சரிபார்ப்பு நீக்கப்பட்டது' : 'சரிபார்க்கப்பட்டது'
                  )
                }
              >
                {member.is_verified ? 'சரிபார்ப்பை நீக்கு' : 'சரிபார்'}
              </Button>
            )}
            {['approved', 'pending_approval'].includes(member.status) && (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={<BlockOutlined />}
                disabled={busy}
                onClick={() => setConfirmAction({ type: 'deactivate', title: 'முடக்க வேண்டுமா?', message: 'இந்த உறுப்பினரை முடக்க வேண்டுமா? அவர்களால் உள்நுழைய முடியாது.' })}
              >
                முடக்கு
              </Button>
            )}
            {member.status === 'blocked' && (
              <Button size="small" variant="outlined" color="success" startIcon={<ReplayOutlined />} disabled={busy} onClick={() => runAction(() => adminMemberService.reactivate(id), 'மீண்டும் செயல்படுத்தப்பட்டது')}>
                மீண்டும் செயல்படுத்து
              </Button>
            )}
            {member.status !== 'archived' && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<ArchiveOutlined />}
                disabled={busy}
                onClick={() => setConfirmAction({ type: 'archive', title: 'காப்பகப்படுத்த வேண்டுமா?', message: 'இந்த உறுப்பினரை காப்பகப்படுத்த வேண்டுமா?' })}
              >
                காப்பகப்படுத்து
              </Button>
            )}
            <Button size="small" variant="outlined" startIcon={<EditOutlined />} onClick={() => setEditOpen(true)}>
              திருத்து
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<MenuBookOutlined />}
              onClick={() => navigate('/admin/booklet', { state: { filters: { registrationNumber: member.registration_number } } })}
            >
              பதிவேடு
            </Button>
            {member.status !== 'approved' && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteOutline />}
                disabled={busy}
                onClick={() => setConfirmAction({ type: 'delete', title: 'நீக்க வேண்டுமா?', message: 'இந்த உறுப்பினரை முழுமையாக நீக்க வேண்டுமா? இந்த செயலை மாற்ற முடியாது.' })}
              >
                நீக்கு
              </Button>
            )}
          </Stack>
        </Box>
        {member.status === 'rejected' && member.rejection_reason && (
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            நிராகரிப்பு காரணம்: {member.rejection_reason}
          </Typography>
        )}
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <InfoCard title="அடிப்படை விவரங்கள்">
            <Field label="பிறந்த தேதி" value={member.dob} />
            <Field label="உயரம் (Msheight)" value={member.height_cm ? `${member.height_cm} cm` : '-'} />
            <Field label="கோத்திரம்" value={member.gothram} />
            <Field label="நட்சத்திரம் / ராசி (sign)" value={`${member.star_id || '-'} / ${member.rasi_id || '-'}`} />
            <Field label="மொபைல் 1 / 2" value={`${member.mobile || '-'} / ${member.whatsapp || '-'}`} />
            <Field label="மின்னஞ்சல்" value={member.email} />
            <Field label="முகவரி" value={member.address} />
            <Field label="குடியிருப்பு (quarter)" value={member.quarter} />
            <Field label="சொந்த ஊர்" value={member.native_place} />
            <Field label="தற்போதைய இருப்பிடம்" value={member.residence} />
          </InfoCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <InfoCard title="குடும்பம் / பதிவாளர்">
            <Field label="தந்தை பெயர்" value={member.father_name} />
            <Field label="தாய் பெயர்" value={member.mother_name} />
            <Field label="சகோதரர்கள் / சகோதரிகள்" value={`${member.brothers ?? '-'} / ${member.sisters ?? '-'}`} />
            <Field label="பதிவாளர் (பரிந்துரையாளர்/சாட்சி)" value={member.registrar_name} />
            <Field label="நேரில் கலந்துகொள்வது" value={member.participating === 'yes' ? 'ஆம்' : member.participating === 'no' ? 'இல்லை' : '-'} />
          </InfoCard>

          <InfoCard title="கட்டணம்" sx={{ mt: 2 }}>
            <Field label="தொகை" value={member.payment_amount ? `₹${member.payment_amount}` : '-'} />
            <Field label="தேதி" value={member.payment_date} />
            <Field label="குறிப்பு எண் (Reference ID)" value={member.payment_reference} />
            {member.payment_screenshot_path && <FileLink label="ஸ்கிரீன்ஷாட்" path={member.payment_screenshot_path} />}
          </InfoCard>
        </Grid>

        {member.payment_screenshot_path && (
          <Grid item xs={12}>
            <InfoCard title="கட்டண ஸ்கிரீன்ஷாட்">
              <Avatar src={apiFileUrl(member.payment_screenshot_path)} variant="rounded" sx={{ width: 160, height: 160 }} />
            </InfoCard>
          </Grid>
        )}
      </Grid>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>நிராகரிப்புக்கான காரணம்</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            minRows={3}
            autoFocus
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="காரணத்தை உள்ளிடவும்..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRejectOpen(false)}>ரத்து</Button>
          <Button variant="contained" color="error" disabled={busy} onClick={handleReject}>
            நிராகரி
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.title}
        message={confirmAction?.message}
        confirmLabel={confirmAction?.type === 'delete' ? 'நீக்கு' : 'உறுதி செய்'}
        confirmColor={confirmAction?.type === 'delete' ? 'error' : 'primary'}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction?.type === 'deactivate') runAction(() => adminMemberService.deactivate(id), 'முடக்கப்பட்டது');
          if (confirmAction?.type === 'archive') runAction(() => adminMemberService.archive(id), 'காப்பகப்படுத்தப்பட்டது');
          if (confirmAction?.type === 'delete')
            runAction(async () => {
              await adminMemberService.remove(id);
              navigate('/admin/members');
            }, 'நீக்கப்பட்டது');
        }}
      />

      <EditMemberDialog open={editOpen} onClose={() => setEditOpen(false)} member={member} onSaved={() => { setEditOpen(false); load(); }} />
    </Box>
  );
}

function InfoCard({ title, children, sx }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, ...sx }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'primary.main' }}>
        {title}
      </Typography>
      <Divider sx={{ mb: 1.5 }} />
      {children}
    </Paper>
  );
}

function Field({ label, value }) {
  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value || '-'}</Typography>
    </Box>
  );
}

function FileLink({ label, path }) {
  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <MuiLink href={apiFileUrl(path)} target="_blank" rel="noopener">
        கோப்பைப் பார்க்க
      </MuiLink>
    </Box>
  );
}

function EditMemberDialog({ open, onClose, member, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && member) {
      setForm({
        name_tamil: member.name_tamil || '',
        name_english: member.name_english || '',
        mobile: member.mobile || '',
        whatsapp: member.whatsapp || '',
        email: member.email || '',
        gothram: member.gothram || '',
        address: member.address || '',
        quarter: member.quarter || '',
        native_place: member.native_place || '',
        residence: member.residence || '',
        registrar_name: member.registrar_name || '',
      });
    }
  }, [open, member]);

  const handleSave = async () => {
    setBusy(true);
    try {
      await adminMemberService.update(member.id, form);
      toast.success('புதுப்பிக்கப்பட்டது');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>சுயவிவரத்தை திருத்து</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="தமிழ் பெயர்" fullWidth value={form.name_tamil || ''} onChange={set('name_tamil')} />
          <TextField label="ஆங்கில பெயர்" fullWidth value={form.name_english || ''} onChange={set('name_english')} />
          <TextField label="மொபைல் 1" fullWidth value={form.mobile || ''} onChange={set('mobile')} />
          <TextField label="மொபைல் 2" fullWidth value={form.whatsapp || ''} onChange={set('whatsapp')} />
          <TextField label="மின்னஞ்சல்" fullWidth value={form.email || ''} onChange={set('email')} />
          <TextField label="கோத்திரம்" fullWidth value={form.gothram || ''} onChange={set('gothram')} />
          <TextField label="முகவரி" fullWidth multiline minRows={2} value={form.address || ''} onChange={set('address')} />
          <TextField label="குடியிருப்பு (quarter)" fullWidth value={form.quarter || ''} onChange={set('quarter')} />
          <TextField label="சொந்த ஊர்" fullWidth value={form.native_place || ''} onChange={set('native_place')} />
          <TextField label="தற்போதைய இருப்பிடம்" fullWidth value={form.residence || ''} onChange={set('residence')} />
          <TextField label="பதிவாளர்" fullWidth value={form.registrar_name || ''} onChange={set('registrar_name')} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>ரத்து</Button>
        <Button variant="contained" disabled={busy} onClick={handleSave}>
          சேமி
        </Button>
      </DialogActions>
    </Dialog>
  );
}
