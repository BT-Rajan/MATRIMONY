import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Grid, TextField, Typography, Button, Alert, ToggleButtonGroup, ToggleButton, MenuItem } from '@mui/material';
import { step5Schema } from '../../../validators/registrationValidators';
import { registrationService } from '../../../services/registrationService';
import { useMasterOptions } from '../../../hooks/useMasterOptions';
import MasterSelect from '../../../components/common/MasterSelect';
import FileDropInput from '../../../components/common/FileDropInput';

export default function Step5Event({ defaults, onSuccess, onBack }) {
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [fileError, setFileError] = useState('');

  const { options: events } = useMasterOptions('events');
  const { options: paymentTypes } = useMasterOptions('payment-types');

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: yupResolver(step5Schema), defaultValues: defaults || { participating: 'no' } });

  const participating = watch('participating');

  const onSubmit = async (values) => {
    setServerError('');
    setFileError('');
    setSubmitting(true);
    try {
      const res = await registrationService.step5(values, { receipt });
      onSuccess(res.data);
    } catch (err) {
      if (err.errors?.receipt) setFileError(err.errors.receipt);
      setServerError(err.message || 'சேமிக்க முடியவில்லை');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
        நிகழ்வு பங்கேற்பு
      </Typography>

      <Controller
        name="participating"
        control={control}
        render={({ field }) => (
          <ToggleButtonGroup exclusive value={field.value} onChange={(_e, v) => v && field.onChange(v)} color="primary" sx={{ mb: 3 }}>
            <ToggleButton value="no">பங்கேற்க மாட்டேன்</ToggleButton>
            <ToggleButton value="yes">பங்கேற்க விரும்புகிறேன்</ToggleButton>
          </ToggleButtonGroup>
        )}
      />

      {participating === 'yes' && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <MasterSelect control={control} name="event_id" label="நிகழ்வு" options={events} errors={errors} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="தொகுதி" {...register('batch')} error={!!errors.batch} helperText={errors.batch?.message} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name="food_preference"
              control={control}
              render={({ field }) => (
                <TextField {...field} value={field.value ?? ''} select fullWidth label="உணவு விருப்பம்" error={!!errors.food_preference} helperText={errors.food_preference?.message}>
                  <MenuItem value="veg">சைவம்</MenuItem>
                  <MenuItem value="nonveg">அசைவம்</MenuItem>
                </TextField>
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <MasterSelect control={control} name="payment_type_id" label="கட்டண வகை" options={paymentTypes} errors={errors} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth type="number" label="தொகை (₹)" {...register('amount')} error={!!errors.amount} helperText={errors.amount?.message} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="பரிவர்த்தனை எண்" {...register('transaction_number')} error={!!errors.transaction_number} helperText={errors.transaction_number?.message} />
          </Grid>
          <Grid item xs={12}>
            <FileDropInput
              label="ரசீது பதிவேற்றம்"
              accept="image/jpeg,image/png,application/pdf"
              file={receipt}
              onChange={setReceipt}
              error={fileError}
              existingLabel={defaults?.receipt_path ? 'ஏற்கனவே பதிவேற்றப்பட்டது' : undefined}
            />
          </Grid>
        </Grid>
      )}

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button variant="outlined" onClick={onBack} fullWidth>பின் செல்</Button>
        <Button type="submit" variant="contained" fullWidth disabled={submitting}>
          {submitting ? 'சமர்ப்பிக்கிறது...' : 'பதிவை முடிக்கவும்'}
        </Button>
      </Box>
    </Box>
  );
}
