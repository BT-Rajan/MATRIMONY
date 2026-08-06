import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Grid, TextField, Typography, Button, Alert, MenuItem } from '@mui/material';
import { step3Schema } from '../../../validators/registrationValidators';
import { registrationService } from '../../../services/registrationService';
import { useMasterOptions } from '../../../hooks/useMasterOptions';
import MasterSelect from '../../../components/common/MasterSelect';
import FileDropInput from '../../../components/common/FileDropInput';

const YN = [['no', 'இல்லை'], ['yes', 'ஆம்']];
const FAMILY_TYPE = [['nuclear', 'தனி குடும்பம்'], ['joint', 'கூட்டு குடும்பம்']];

export default function Step3Family({ defaults, onSuccess, onBack }) {
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [familyPhoto, setFamilyPhoto] = useState(null);

  const { options: incomes } = useMasterOptions('incomes');

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(step3Schema),
    defaultValues: defaults || { brothers: 0, married_brothers: 0, sisters: 0, married_sisters: 0 },
  });

  const onSubmit = async (values) => {
    setServerError('');
    setSubmitting(true);
    try {
      const res = await registrationService.step3(values, { familyPhoto });
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
        குடும்ப விவரங்கள்
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="தந்தை பெயர்" {...register('father_name')} error={!!errors.father_name} helperText={errors.father_name?.message} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="தாய் பெயர்" {...register('mother_name')} error={!!errors.mother_name} helperText={errors.mother_name?.message} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="தந்தை தொழில் (விருப்பம்)" {...register('father_occupation')} error={!!errors.father_occupation} helperText={errors.father_occupation?.message} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <SelectField label="பெற்றோர் உயிருடன் உள்ளனரா" name="parents_alive" control={control} errors={errors} options={YN} />
        </Grid>

        <Grid item xs={6} sm={3}>
          <TextField fullWidth type="number" label="சகோதரர்கள்" {...register('brothers')} error={!!errors.brothers} helperText={errors.brothers?.message} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <TextField fullWidth type="number" label="திருமணமான சகோதரர்கள்" {...register('married_brothers')} error={!!errors.married_brothers} helperText={errors.married_brothers?.message} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <TextField fullWidth type="number" label="சகோதரிகள்" {...register('sisters')} error={!!errors.sisters} helperText={errors.sisters?.message} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <TextField fullWidth type="number" label="திருமணமான சகோதரிகள்" {...register('married_sisters')} error={!!errors.married_sisters} helperText={errors.married_sisters?.message} />
        </Grid>

        <Grid item xs={12} sm={4}>
          <SelectField label="குடும்ப வகை" name="family_type" control={control} errors={errors} options={FAMILY_TYPE} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <SelectField label="சொந்த வீடு" name="own_house" control={control} errors={errors} options={YN} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MasterSelect control={control} name="family_income_id" label="குடும்ப வருமானம் (விருப்பம்)" options={incomes} errors={errors} required={false} />
        </Grid>

        <Grid item xs={12}>
          <FileDropInput
            label="குடும்ப புகைப்படம் (விருப்பம்)"
            accept="image/jpeg,image/png"
            file={familyPhoto}
            onChange={setFamilyPhoto}
            existingLabel={defaults?.family_photo_path ? 'ஏற்கனவே பதிவேற்றப்பட்டது' : undefined}
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

function SelectField({ label, name, control, errors, options }) {
  const err = errors?.[name];
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField {...field} value={field.value ?? ''} select fullWidth label={label} error={!!err} helperText={err?.message}>
          {options.map(([val, lab]) => (
            <MenuItem key={val} value={val}>{lab}</MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}
