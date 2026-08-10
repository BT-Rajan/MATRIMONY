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

  const { member, photos, horoscope, family, reference, event } = data;
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
            <Avatar src={member.photo_path ? apiFileUrl(member.photo_path) : undefined} sx={{ width: 64, height: 64 }}>
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
            <Field label="உயரம் / எடை" value={`${member.height_cm || '-'} cm / ${member.weight_kg || '-'} kg`} />
            <Field label="திருமண நிலை" value={member.marital_status} />
            <Field label="நிறுவனம் / பணி இடம்" value={[member.company_name, member.work_location].filter(Boolean).join(' • ') || '-'} />
            <Field label="மொபைல்" value={member.mobile} />
            <Field label="வாட்ஸ்அப்" value={member.whatsapp} />
            <Field label="மின்னஞ்சல்" value={member.email} />
            <Field label="சொந்த ஊர்" value={member.native_place} />
            <Field label="முகவரி" value={member.current_address} />
            <Field label="பின்கோடு" value={member.pincode} />
            <Field label="மாநிலம் / நாடு" value={`${member.state || '-'}, ${member.country || '-'}`} />
            <Field label="எனை பற்றி" value={member.about_myself} />
            <Field label="உணவு / புகை / மது" value={`${member.diet || '-'} / ${member.smoking || '-'} / ${member.drinking || '-'}`} />
          </InfoCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <InfoCard title="ஜாதக விவரங்கள்">
            {horoscope ? (
              <>
                <Field label="பிறந்த நேரம் / இடம்" value={`${horoscope.birth_time} • ${horoscope.birth_place}`} />
                <Field label="லக்னம் / கோத்திரம்" value={`${horoscope.lagnam} / ${horoscope.gothram || '-'}`} />
                <Field label="செவ்வாய் / ராகு / கேது / கால சர்ப்பம்" value={`${horoscope.chevvai_dosham} / ${horoscope.rahu_dosham} / ${horoscope.kethu_dosham} / ${horoscope.kalasarpa_dosham}`} />
                {horoscope.horoscope_file_path && (
                  <FileLink label="ஜாதக ஆவணம்" path={horoscope.horoscope_file_path} />
                )}
              </>
            ) : (
              <Typography color="text.secondary">தரவு இல்லை</Typography>
            )}
          </InfoCard>

          <InfoCard title="குடும்ப விவரங்கள்" sx={{ mt: 2 }}>
            {family ? (
              <>
                <Field label="தந்தை / தாய்" value={`${family.father_name} / ${family.mother_name}`} />
                <Field label="தந்தை தொடர்பு" value={[family.father_mobile, family.father_email].filter(Boolean).join(' • ') || '-'} />
                <Field label="பெற்றோர் பூர்வீகம்" value={[family.father_native_place, family.mother_native_place].filter(Boolean).join(' / ') || '-'} />
                <Field label="பெற்றோர் உயிருடன்" value={family.parents_alive} />
                <Field label="பிறப்பு வரிசை" value={family.birth_order} />
                <Field label="சகோதரர் / சகோதரி" value={`${family.brothers} (${family.married_brothers} மணமானவர்) / ${family.sisters} (${family.married_sisters} மணமானவர்)`} />
                <Field label="குடும்ப வகை / சொந்த வீடு" value={`${family.family_type} / ${family.own_house}`} />
              </>
            ) : (
              <Typography color="text.secondary">தரவு இல்லை</Typography>
            )}
          </InfoCard>

          <InfoCard title="பரிந்துரையாளர்" sx={{ mt: 2 }}>
            {reference ? (
              <>
                <Field label="பெயர்" value={reference.reference_name} />
                <Field label="தொலைபேசி" value={reference.phone} />
                <Field label="குறிப்புகள்" value={reference.remarks} />
              </>
            ) : (
              <Typography color="text.secondary">தரவு இல்லை</Typography>
            )}
          </InfoCard>

          <InfoCard title="நிகழ்வு பங்கேற்பு" sx={{ mt: 2 }}>
            {event && event.participating === 'yes' ? (
              <>
                <Field label="தொகுதி" value={event.batch} />
                <Field label="தொகை" value={event.amount ? `₹${event.amount}` : '-'} />
                <Field label="பரிவர்த்தனை எண்" value={event.transaction_number} />
                {event.receipt_path && <FileLink label="ரசீது" path={event.receipt_path} />}
              </>
            ) : (
              <Typography color="text.secondary">பங்கேற்கவில்லை</Typography>
            )}
          </InfoCard>
        </Grid>

        {photos?.length > 0 && (
          <Grid item xs={12}>
            <InfoCard title="கூடுதல் புகைப்படங்கள்">
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {photos.map((p) => (
                  <Avatar key={p.id} src={apiFileUrl(p.file_path)} variant="rounded" sx={{ width: 72, height: 72 }} />
                ))}
              </Stack>
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
        current_address: member.current_address || '',
        state: member.state || '',
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

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>சுயவிவரத்தை திருத்து</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="தமிழ் பெயர்" fullWidth value={form.name_tamil || ''} onChange={(e) => setForm({ ...form, name_tamil: e.target.value })} />
          <TextField label="ஆங்கில பெயர்" fullWidth value={form.name_english || ''} onChange={(e) => setForm({ ...form, name_english: e.target.value })} />
          <TextField label="மொபைல்" fullWidth value={form.mobile || ''} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          <TextField label="வாட்ஸ்அப்" fullWidth value={form.whatsapp || ''} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          <TextField label="மின்னஞ்சல்" fullWidth value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField label="முகவரி" fullWidth multiline minRows={2} value={form.current_address || ''} onChange={(e) => setForm({ ...form, current_address: e.target.value })} />
          <TextField label="மாநிலம்" fullWidth value={form.state || ''} onChange={(e) => setForm({ ...form, state: e.target.value })} />
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
