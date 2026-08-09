import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Grid, TextField, Typography, Button, Alert, MenuItem } from '@mui/material';
import { step2Schema } from '../../../validators/registrationValidators';
import { registrationService } from '../../../services/registrationService';
import { useMasterOptions } from '../../../hooks/useMasterOptions';
import MasterSelect from '../../../components/common/MasterSelect';
import FileDropInput from '../../../components/common/FileDropInput';

const YN = [
  ['no', 'இல்லை'],
  ['yes', 'ஆம்'],
];

export default function Step2Horoscope({ defaults, onSuccess, onBack }) {
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [horoscopeDocument, setHoroscopeDocument] = useState(null);
  const [fileError, setFileError] = useState('');

  const { options: stars } = useMasterOptions('stars');
  const { options: rasis } = useMasterOptions('rasis');

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(step2Schema), defaultValues: defaults || {} });

  const onSubmit = async (values) => {
    setServerError('');
    setFileError('');
    setSubmitting(true);
    try {
      const res = await registrationService.step2(values, { horoscopeDocument });
      onSuccess(res.data.registration_step);
    } catch (err) {
      if (err.errors?.horoscope_document) setFileError(err.errors.horoscope_document);
      setServerError(err.message || 'சேமிக்க முடியவில்லை');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
        ஜாதக விவரங்கள்
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            type="date"
            label="பிறந்த தேதி"
            {...register('birth_date')}
            error={!!errors.birth_date}
            helperText={errors.birth_date?.message || 'படிவம் 1 இல் உள்ள தேதியுடன் பொருந்த வேண்டும்'}
            slotProps={{
              inputLabel: { shrink: true }
            }} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            type="time"
            label="பிறந்த நேரம்"
            {...register('birth_time')}
            error={!!errors.birth_time}
            helperText={errors.birth_time?.message}
            slotProps={{
              inputLabel: { shrink: true }
            }} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth label="பிறந்த இடம்" {...register('birth_place')} error={!!errors.birth_place} helperText={errors.birth_place?.message} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MasterSelect control={control} name="star_id" label="நட்சத்திரம்" options={stars} errors={errors} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MasterSelect control={control} name="rasi_id" label="ராசி" options={rasis} errors={errors} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth label="லக்னம்" {...register('lagnam')} error={!!errors.lagnam} helperText={errors.lagnam?.message} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="கோத்திரம் (விருப்பம்)" {...register('gothram')} error={!!errors.gothram} helperText={errors.gothram?.message} />
        </Grid>

        {[
          ['chevvai_dosham', 'செவ்வாய் தோஷம்'],
          ['rahu_dosham', 'ராகு தோஷம்'],
          ['kethu_dosham', 'கேது தோஷம்'],
          ['kalasarpa_dosham', 'கால சர்ப்ப தோஷம்'],
        ].map(([name, label]) => (
          <Grid item xs={6} sm={3} key={name}>
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <TextField {...field} value={field.value ?? ''} select fullWidth label={label} error={!!errors[name]} helperText={errors[name]?.message}>
                  {YN.map(([val, lab]) => (
                    <MenuItem key={val} value={val}>{lab}</MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
        ))}

        <Grid item xs={12}>
          <FileDropInput
            label="ஜாதக ஆவணம் (jpg/png/pdf, அதிகபட்சம் 10MB)"
            accept="image/jpeg,image/png,application/pdf"
            file={horoscopeDocument}
            onChange={setHoroscopeDocument}
            error={fileError}
            existingLabel={defaults?.horoscope_file_path ? 'ஏற்கனவே பதிவேற்றப்பட்டது — மாற்ற புதிய கோப்பைத் தேர்ந்தெடுக்கவும்' : undefined}
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button variant="outlined" onClick={onBack} fullWidth>பின் செல்</Button>
        <Button type="submit" variant="contained" fullWidth disabled={submitting}>
          {submitting ? 'சேமிக்கிறது...' : 'அடுத்த படி'}
        </Button>
      </Box>
    </Box>
  );
}
