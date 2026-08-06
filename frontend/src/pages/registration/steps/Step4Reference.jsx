import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Grid, TextField, Typography, Button, Alert } from '@mui/material';
import { step4Schema } from '../../../validators/registrationValidators';
import { registrationService } from '../../../services/registrationService';
import { useMasterOptions } from '../../../hooks/useMasterOptions';
import MasterSelect from '../../../components/common/MasterSelect';

export default function Step4Reference({ defaults, onSuccess, onBack }) {
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { options: relationships } = useMasterOptions('relationships');

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(step4Schema), defaultValues: defaults || {} });

  const onSubmit = async (values) => {
    setServerError('');
    setSubmitting(true);
    try {
      const res = await registrationService.step4(values);
      onSuccess(res.data.registration_step);
    } catch (err) {
      setServerError(err.message || 'சேமிக்க முடியவில்லை');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
        பரிந்துரையாளர் விவரங்கள்
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="பரிந்துரையாளர் பெயர்" {...register('reference_name')} error={!!errors.reference_name} helperText={errors.reference_name?.message} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <MasterSelect control={control} name="relationship_id" label="உறவுமுறை" options={relationships} errors={errors} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="தொலைபேசி எண்" {...register('phone')} error={!!errors.phone} helperText={errors.phone?.message} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="அறிமுகமான காலம் (விருப்பம்)" placeholder="எ.கா. 10 வருடங்கள்" {...register('known_since')} error={!!errors.known_since} helperText={errors.known_since?.message} />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth multiline minRows={2} label="முகவரி (விருப்பம்)" {...register('address')} error={!!errors.address} helperText={errors.address?.message} />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth multiline minRows={2} label="குறிப்புகள் (விருப்பம்)" {...register('remarks')} error={!!errors.remarks} helperText={errors.remarks?.message} />
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
