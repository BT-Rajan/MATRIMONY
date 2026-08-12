import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box,
  Container,
  Paper,
  Grid,
  TextField,
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
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutlineOutlined';
import { useNavigate } from 'react-router-dom';
import { registrationSchema } from '../../validators/registrationValidators';
import { registrationService } from '../../services/registrationService';
import { useMasterOptions } from '../../hooks/useMasterOptions';
import MasterSelect from '../../components/common/MasterSelect';
import FileDropInput from '../../components/common/FileDropInput';
import KolamDivider from '../../components/common/KolamDivider';
import { useAuth } from '../../contexts/AuthContext';

export default function RegistrationWizard() {
  const { establishSession } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [screenshotError, setScreenshotError] = useState('');
  const [registeredNumber, setRegisteredNumber] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(registrationSchema),
    defaultValues: { brothers: 0, sisters: 0 },
  });

  const { options: educations } = useMasterOptions('educations');
  const { options: occupations } = useMasterOptions('occupations');
  const { options: stars } = useMasterOptions('stars');
  const { options: rasis } = useMasterOptions('rasis');

  const onSubmit = async (values) => {
    setServerError('');
    setScreenshotError('');
    if (!paymentScreenshot) {
      setScreenshotError('கட்டண ஸ்கிரீன்ஷாட் தேவை');
      return;
    }

    setSubmitting(true);
    try {
      const res = await registrationService.register(values, { paymentScreenshot });
      establishSession(res.data);
      setRegisteredNumber(res.data.user.registration_number);
    } catch (err) {
      if (err.errors?.payment_screenshot) {
        setScreenshotError(err.errors.payment_screenshot);
      }
      setServerError(err.message || 'சமர்ப்பிக்க முடியவில்லை');
    } finally {
      setSubmitting(false);
    }
  };

  if (registeredNumber) {
    return (
      <Box sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 3 }}>
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, textAlign: 'center', maxWidth: 420 }}>
          <CheckCircleOutline color="success" sx={{ fontSize: 56, mb: 1 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            உங்கள் பதிவு முடிக்கப்பட்டது
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            பதிவு எண்: {registeredNumber} — நிர்வாகி அனுமதிக்காக காத்திருக்கிறது.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/dashboard')}>
            டாஷ்போர்டு செல்க
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', py: { xs: 3, sm: 5 } }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5" color="primary.main">
            புதிய பதிவு
          </Typography>
          <Typography variant="body2" color="text.secondary">
            கார்காத்தார் மங்கள சந்திப்பு — குரோம்பேட்டை
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <KolamDivider />
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ p: { xs: 2.5, sm: 4 } }}>
            {serverError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {serverError}
              </Alert>
            )}

            <Section title="பதிவு வகை">
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <ToggleButtonGroup exclusive value={field.value || null} onChange={(_e, v) => v && field.onChange(v)} color="primary">
                    <ToggleButton value="groom">மணமகன் (Groom)</ToggleButton>
                    <ToggleButton value="bride">மணமகள் (Bride)</ToggleButton>
                  </ToggleButtonGroup>
                )}
              />
              {errors.gender && (
                <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                  {errors.gender.message}
                </Typography>
              )}
            </Section>

            <Section title="அடிப்படை விவரங்கள்">
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="பெயர்" {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="பிறந்த தேதி"
                    {...register('dob')}
                    error={!!errors.dob}
                    helperText={errors.dob?.message}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="கோத்திரம்" {...register('gothram')} error={!!errors.gothram} helperText={errors.gothram?.message} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth type="number" label="உயரம் (cm)" {...register('height_cm')} error={!!errors.height_cm} helperText={errors.height_cm?.message} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <MasterSelect control={control} name="star_id" label="நட்சத்திரம்" options={stars} errors={errors} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <MasterSelect control={control} name="rasi_id" label="ராசி" options={rasis} errors={errors} />
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
              </Grid>
            </Section>

            <Section title="குடும்பம்">
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="தந்தை பெயர்" {...register('father_name')} error={!!errors.father_name} helperText={errors.father_name?.message} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="தாய் பெயர்" {...register('mother_name')} error={!!errors.mother_name} helperText={errors.mother_name?.message} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField fullWidth type="number" label="சகோதரர்கள்" {...register('brothers')} error={!!errors.brothers} helperText={errors.brothers?.message} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField fullWidth type="number" label="சகோதரிகள்" {...register('sisters')} error={!!errors.sisters} helperText={errors.sisters?.message} />
                </Grid>
              </Grid>
            </Section>

            <Section title="முகவரி">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth multiline minRows={2} label="முகவரி" {...register('address')} error={!!errors.address} helperText={errors.address?.message} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="குடியிருப்பு / குறை (Quarter)" {...register('quarter')} error={!!errors.quarter} helperText={errors.quarter?.message} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="சொந்த ஊர்" {...register('native_place')} error={!!errors.native_place} helperText={errors.native_place?.message} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="தற்போதைய இருப்பிடம்" {...register('residence')} error={!!errors.residence} helperText={errors.residence?.message} />
                </Grid>
              </Grid>
            </Section>

            <Section title="பதிவாளர்">
              <TextField
                fullWidth
                label="பதிவாளர் பெயர் (பரிந்துரையாளர்/சாட்சி)"
                {...register('registrar_name')}
                error={!!errors.registrar_name}
                helperText={errors.registrar_name?.message}
              />
            </Section>

            <Section title="தொடர்பு விவரங்கள்">
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="மொபைல் எண் 1" {...register('phone1')} error={!!errors.phone1} helperText={errors.phone1?.message} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="மொபைல் எண் 2 (விருப்பம்)" {...register('phone2')} error={!!errors.phone2} helperText={errors.phone2?.message} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="மின்னஞ்சல்" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
                </Grid>
              </Grid>
            </Section>

            <Section title="நிகழ்வு">
              <ToggleGroupField
                label="நேரில் கலந்துகொள்வீர்களா?"
                name="participating"
                control={control}
                errors={errors}
                options={[
                  ['no', 'இல்லை'],
                  ['yes', 'ஆம்'],
                ]}
              />
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
                      },
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

            <Section title="கட்டணம்">
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth type="number" label="தொகை" {...register('payment_amount')} error={!!errors.payment_amount} helperText={errors.payment_amount?.message} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="date"
                    label="தேதி"
                    {...register('payment_date')}
                    error={!!errors.payment_date}
                    helperText={errors.payment_date?.message}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="குறிப்பு எண் (Reference ID)" {...register('payment_reference')} error={!!errors.payment_reference} helperText={errors.payment_reference?.message} />
                </Grid>
                <Grid item xs={12}>
                  <FileDropInput
                    label="கட்டண ஸ்கிரீன்ஷாட் (jpg/png/pdf, அதிகபட்சம் 5MB)"
                    accept="image/jpeg,image/png,application/pdf"
                    file={paymentScreenshot}
                    onChange={setPaymentScreenshot}
                    error={screenshotError}
                  />
                </Grid>
              </Grid>
            </Section>

            <Button type="submit" variant="contained" size="large" fullWidth disabled={submitting} sx={{ mt: 1 }}>
              {submitting ? 'சமர்ப்பிக்கிறது...' : 'பதிவு செய்யவும்'}
            </Button>
          </Box>
        </Paper>
      </Container>
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
