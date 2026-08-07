import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
} from '@mui/material';
import { useMasterOptions } from '../../../hooks/useMasterOptions';const YES_NO = [
  ['', 'அனைத்தும்'],
  ['1', 'ஆம்'],
  ['0', 'இல்லை'],
];

export default function AdvancedSearchDialog({ open, onClose, initial, onApply }) {
  const [form, setForm] = useState(initial || {});

  const { options: religions } = useMasterOptions('religions');
  const { options: castes } = useMasterOptions('castes', form.religionId);
  const { options: districts } = useMasterOptions('districts');
  const { options: educations } = useMasterOptions('educations');
  const { options: occupations } = useMasterOptions('occupations');
  const { options: incomes } = useMasterOptions('incomes');
  const { options: stars } = useMasterOptions('stars');
  const { options: rasis } = useMasterOptions('rasis');
  const { options: doshams } = useMasterOptions('doshams');
  const { options: events } = useMasterOptions('events');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleClear = () => setForm({});
  const handleApply = () => {
    onApply(form);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>மேம்பட்ட தேடல்</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" label="பதிவு எண்" value={form.registrationNumber || ''} onChange={set('registrationNumber')} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField fullWidth size="small" label="மொபைல்" value={form.phone || ''} onChange={set('phone')} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField fullWidth size="small" label="மின்னஞ்சல்" value={form.email || ''} onChange={set('email')} />
          </Grid>

          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" type="number" label="வயது (குறைந்தபட்சம்)" value={form.ageMin || ''} onChange={set('ageMin')} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" type="number" label="வயது (அதிகபட்சம்)" value={form.ageMax || ''} onChange={set('ageMax')} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" type="number" label="உயரம் cm (குறை.)" value={form.heightMin || ''} onChange={set('heightMin')} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" type="number" label="உயரம் cm (அதி.)" value={form.heightMax || ''} onChange={set('heightMax')} />
          </Grid>

          <Grid item xs={12} sm={4}>
            <SimpleSelect label="மதம்" value={form.religionId} onChange={(v) => setForm((f) => ({ ...f, religionId: v, casteId: '' }))} options={religions} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <SimpleSelect label="சாதி" value={form.casteId} onChange={(v) => setForm((f) => ({ ...f, casteId: v }))} options={castes} disabled={!form.religionId} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <SimpleSelect label="மாவட்டம்" value={form.districtId} onChange={(v) => setForm((f) => ({ ...f, districtId: v }))} options={districts} />
          </Grid>

          <Grid item xs={12} sm={4}>
            <SimpleSelect label="கல்வி" value={form.educationId} onChange={(v) => setForm((f) => ({ ...f, educationId: v }))} options={educations} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <SimpleSelect label="தொழில்" value={form.occupationId} onChange={(v) => setForm((f) => ({ ...f, occupationId: v }))} options={occupations} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <SimpleSelect label="வருமானம்" value={form.incomeId} onChange={(v) => setForm((f) => ({ ...f, incomeId: v }))} options={incomes} />
          </Grid>

          <Grid item xs={12} sm={4}>
            <SimpleSelect label="நட்சத்திரம்" value={form.starId} onChange={(v) => setForm((f) => ({ ...f, starId: v }))} options={stars} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <SimpleSelect label="ராசி" value={form.rasiId} onChange={(v) => setForm((f) => ({ ...f, rasiId: v }))} options={rasis} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <SimpleSelect label="தோஷம்" value={form.doshamId} onChange={(v) => setForm((f) => ({ ...f, doshamId: v }))} options={doshams} />
          </Grid>

          <Grid item xs={6} sm={4}>
            <TextField fullWidth size="small" label="மாநிலம்" value={form.state || ''} onChange={set('state')} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField fullWidth size="small" label="நாடு" value={form.country || ''} onChange={set('country')} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <SimpleSelect label="நிகழ்வு" value={form.eventId} onChange={(v) => setForm((f) => ({ ...f, eventId: v }))} options={events} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="பரிந்துரையாளர் (பெயர்/எண்)" value={form.reference || ''} onChange={set('reference')} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" select label="சரிபார்க்கப்பட்டதா" value={form.isVerified ?? ''} onChange={set('isVerified')}>
              {YES_NO.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" select label="கட்டணம் செலுத்தியதா" value={form.payment ?? ''} onChange={set('payment')}>
              {YES_NO.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
            </TextField>
          </Grid>

          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" select label="புகைப்படம் உள்ளதா" value={form.photoAvailable ?? ''} onChange={set('photoAvailable')}>
              {YES_NO.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" select label="ஜாதகம் உள்ளதா" value={form.horoscopeAvailable ?? ''} onChange={set('horoscopeAvailable')}>
              {YES_NO.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClear}>அழி</Button>
        <Button onClick={onClose}>ரத்து</Button>
        <Button variant="contained" onClick={handleApply}>
          தேடு
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function SimpleSelect({ label, value, onChange, options, disabled }) {
  return (
    <TextField fullWidth size="small" select label={label} value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
      <MenuItem value="">அனைத்தும்</MenuItem>
      {options.map((opt) => (
        <MenuItem key={opt.id} value={opt.id}>
          {opt.name_tamil} ({opt.name_english})
        </MenuItem>
      ))}
    </TextField>
  );
}
