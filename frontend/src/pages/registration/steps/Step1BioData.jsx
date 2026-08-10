import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  Alert,
  Divider,
  InputAdornment,
  IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { step1Schema } from '../../../validators/registrationValidators';
import { registrationService } from '../../../services/registrationService';
import { useMasterOptions } from '../../../hooks/useMasterOptions';
import MasterSelect from '../../../components/common/MasterSelect';
import FileDropInput from '../../../components/common/FileDropInput';
import { useAuth } from '../../../contexts/AuthContext';

const MARITAL_OPTIONS = [
  ['single', 'திருமணமாகாதவர்'],
  ['divorced', 'விவாகரத்தானவர்'],
  ['widowed', 'விதவை/விதவன்'],
  ['separated', 'பிரிந்திருப்பவர்'],
];
const DIET_OPTIONS = [
  ['veg', 'சைவம்'],
  ['nonveg', 'அசைவம்'],
];
const YN_OPTIONS = [
  ['no', 'இல்லை'],
  ['yes', 'ஆம்'],
];
const YN_OCCASIONAL_OPTIONS = [
  ['no', 'இல்லை'],
  ['occasionally', 'எப்போதாவது'],
  ['yes', 'ஆம்'],
];

export default function Step1BioData({ onSuccess }) {
  const { establishSession } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [idProof, setIdProof] = useState(null);
  const [additionalPhotos, setAdditionalPhotos] = useState([]);
  const [fileErrors, setFileErrors] = useState({});

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: yupResolver(step1Schema), defaultValues: { country: 'India', physically_challenged: 'no' } });

  const religionId = watch('religion_id');
  const casteId = watch('caste_id');

  const { options: religions } = useMasterOptions('religions');
  const { options: castes } = useMasterOptions('castes', religionId);
  const { options: subCastes } = useMasterOptions('sub-castes', casteId);
  const { options: districts } = useMasterOptions('districts');
  const { options: educations } = useMasterOptions('educations');
  const { options: occupations } = useMasterOptions('occupations');
  const { options: incomes } = useMasterOptions('incomes');
  const { options: stars } = useMasterOptions('stars');
  const { options: rasis } = useMasterOptions('rasis');
  const { options: doshams } = useMasterOptions('doshams');

  const onSubmit = async (values) => {
    setServerError('');
    setFileErrors({});
    const newFileErrors = {};
    if (!photo) newFileErrors.photo = 'புகைப்படம் தேவை';
    if (!idProof) newFileErrors.id_proof = 'அடையாள சான்று தேவை';
    if (Object.keys(newFileErrors).length) {
      setFileErrors(newFileErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await registrationService.step1(values, { photo, idProof, additionalPhotos });
      establishSession(res.data);
      onSuccess(res.data);
    } catch (err) {
      if (err.errors) {
        setFileErrors(
          Object.fromEntries(Object.entries(err.errors).filter(([k]) => ['photo', 'id_proof'].includes(k)))
        );
      }
      setServerError(err.message || 'சேமிக்க முடியவில்லை');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {serverError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {serverError}
        </Alert>
      )}

      <Section title="பதிவு வகை">
        <Controller
          name="registration_type"
          control={control}
          render={({ field }) => (
            <ToggleButtonGroup exclusive value={field.value || null} onChange={(_e, v) => v && field.onChange(v)} color="primary">
              <ToggleButton value="groom">மணமகன் (Groom)</ToggleButton>
              <ToggleButton value="bride">மணமகள் (Bride)</ToggleButton>
            </ToggleButtonGroup>
          )}
        />
        {errors.registration_type && (
          <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
            {errors.registration_type.message}
          </Typography>
        )}
      </Section>

      <Section title="அடிப்படை விவரங்கள்">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="தமிழ் பெயர்" {...register('name_tamil')} error={!!errors.name_tamil} helperText={errors.name_tamil?.message} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="ஆங்கில பெயர்" {...register('name_english')} error={!!errors.name_english} helperText={errors.name_english?.message} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label="பிறந்த தேதி"
              {...register('dob')}
              error={!!errors.dob}
              helperText={errors.dob?.message}
              slotProps={{
                inputLabel: { shrink: true }
              }} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField fullWidth type="number" label="உயரம் (cm)" {...register('height_cm')} error={!!errors.height_cm} helperText={errors.height_cm?.message} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField fullWidth type="number" label="எடை (kg) - விருப்பம்" {...register('weight_kg')} error={!!errors.weight_kg} helperText={errors.weight_kg?.message} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name="marital_status"
              control={control}
              render={({ field }) => (
                <TextField {...field} value={field.value ?? ''} select fullWidth label="திருமண நிலை" error={!!errors.marital_status} helperText={errors.marital_status?.message}>
                  {MARITAL_OPTIONS.map(([val, lab]) => (
                    <MenuItem key={val} value={val}>{lab}</MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
        </Grid>
      </Section>

      <Section title="கல்வி மற்றும் தொழில்">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <MasterSelect control={control} name="education_id" label="கல்வி" options={educations} errors={errors} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <MasterSelect control={control} name="occupation_id" label="தொழில்" options={occupations} errors={errors} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="நிறுவனம் (விருப்பம்)" {...register('company_name')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="பணி இடம் (விருப்பம்)" {...register('work_location')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <MasterSelect control={control} name="income_id" label="வருமானம் (விருப்பம்)" options={incomes} errors={errors} required={false} />
          </Grid>
        </Grid>
      </Section>

      <Section title="மதம் மற்றும் ஜாதக அடிப்படை">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <MasterSelect control={control} name="religion_id" label="மதம்" options={religions} errors={errors} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <MasterSelect control={control} name="caste_id" label="சாதி" options={castes} errors={errors} disabled={!religionId} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <MasterSelect control={control} name="sub_caste_id" label="உப சாதி (விருப்பம்)" options={subCastes} errors={errors} disabled={!casteId} required={false} />
          </Grid>
          <Grid item xs={12} sm={6} />
          <Grid item xs={12} sm={4}>
            <MasterSelect control={control} name="star_id" label="நட்சத்திரம்" options={stars} errors={errors} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <MasterSelect control={control} name="rasi_id" label="ராசி" options={rasis} errors={errors} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <MasterSelect control={control} name="dosham_id" label="தோஷம்" options={doshams} errors={errors} />
          </Grid>
        </Grid>
      </Section>

      <Section title="முகவரி">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="சொந்த ஊர்" {...register('native_place')} error={!!errors.native_place} helperText={errors.native_place?.message} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <MasterSelect control={control} name="district_id" label="மாவட்டம்" options={districts} errors={errors} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline minRows={2} label="தற்போதைய முகவரி" {...register('current_address')} error={!!errors.current_address} helperText={errors.current_address?.message} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="பின்கோடு (விருப்பம்)" {...register('pincode')} error={!!errors.pincode} helperText={errors.pincode?.message} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="மாநிலம்" {...register('state')} error={!!errors.state} helperText={errors.state?.message} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="நாடு" {...register('country')} error={!!errors.country} helperText={errors.country?.message} />
          </Grid>
        </Grid>
      </Section>

      <Section title="தொடர்பு விவரங்கள்">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="மொபைல் எண்" {...register('mobile')} error={!!errors.mobile} helperText={errors.mobile?.message} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="வாட்ஸ்அப் எண் (விருப்பம்)" {...register('whatsapp')} error={!!errors.whatsapp} helperText={errors.whatsapp?.message} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="மின்னஞ்சல்" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
          </Grid>
        </Grid>
      </Section>

      <Section title="புகைப்படம் மற்றும் அடையாள சான்று">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FileDropInput
              label="புகைப்படம் (jpg/png, அதிகபட்சம் 5MB)"
              accept="image/jpeg,image/png"
              file={photo}
              onChange={setPhoto}
              error={fileErrors.photo}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FileDropInput
              label="அடையாள சான்று (jpg/png/pdf, அதிகபட்சம் 5MB)"
              accept="image/jpeg,image/png,application/pdf"
              file={idProof}
              onChange={setIdProof}
              error={fileErrors.id_proof}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
              கூடுதல் புகைப்படங்கள் (அதிகபட்சம் 10, விருப்பம்)
            </Typography>
            <Button component="label" variant="outlined" size="small">
              கோப்புகளைத் தேர்ந்தெடு
              <input
                type="file"
                hidden
                multiple
                accept="image/jpeg,image/png"
                onChange={(e) => setAdditionalPhotos(Array.from(e.target.files || []).slice(0, 10))}
              />
            </Button>
            {additionalPhotos.length > 0 && (
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }} color="text.secondary">
                {additionalPhotos.length} கோப்பு(கள்) தேர்ந்தெடுக்கப்பட்டது
              </Typography>
            )}
          </Grid>
        </Grid>
      </Section>

      <Section title="எனை பற்றி (விருப்பம்)">
        <TextField
          fullWidth
          multiline
          minRows={3}
          label="எனை பற்றி"
          {...register('about_myself')}
          error={!!errors.about_myself}
          helperText={errors.about_myself?.message}
        />
      </Section>

      <Section title="வாழ்க்கை முறை">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <ToggleGroupField label="உணவுப் பழக்கம்" name="diet" control={control} errors={errors} options={DIET_OPTIONS} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <ToggleGroupField label="உடல் ஊனம்" name="physically_challenged" control={control} errors={errors} options={YN_OPTIONS} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <ToggleGroupField label="புகைபிடித்தல்" name="smoking" control={control} errors={errors} options={YN_OCCASIONAL_OPTIONS} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <ToggleGroupField label="மது அருந்துதல்" name="drinking" control={control} errors={errors} options={YN_OCCASIONAL_OPTIONS} />
          </Grid>
        </Grid>
      </Section>

      <Section title="கடவுச்சொல் உருவாக்கு">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="கடவுச்சொல்"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword((s) => !s)}>
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="கடவுச்சொல்லை உறுதிப்படுத்தவும்"
              {...register('password_confirmation')}
              error={!!errors.password_confirmation}
              helperText={errors.password_confirmation?.message}
            />
          </Grid>
        </Grid>
      </Section>

      <Button type="submit" variant="contained" size="large" fullWidth disabled={submitting} sx={{ mt: 1 }}>
        {submitting ? 'சமர்ப்பிக்கிறது...' : 'அடுத்த படி'}
      </Button>
    </Box>
  );
}

function Section({ title, children }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'primary.main' }}>
        {title}
      </Typography>
      {children}
      <Divider sx={{ mt: 3 }} />
    </Box>
  );
}

function ToggleGroupField({ label, name, control, errors, options }) {
  const err = errors?.[name];
  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <ToggleButtonGroup exclusive value={field.value || null} onChange={(_e, v) => v && field.onChange(v)} size="small" color="primary" fullWidth>
            {options.map(([val, lab]) => (
              <ToggleButton key={val} value={val}>
                {lab}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}
      />
      {err && (
        <Typography variant="caption" color="error" display="block">
          {err.message}
        </Typography>
      )}
    </Box>
  );
}
