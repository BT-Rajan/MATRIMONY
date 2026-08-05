import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  FormControlLabel,
  Switch,
  MenuItem,
  Alert,
} from '@mui/material';
import { buildMasterSchema } from '../../../validators/masterValidators';
import { masterService } from '../../../services/masterService';

export default function MasterFormDialog({ open, onClose, onSaved, config, editingRow, lockedParentId }) {
  const [parentOptions, setParentOptions] = useState([]);
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!editingRow;
  const schema = buildMasterSchema(config);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema), defaultValues: { is_active: true, sort_order: 0 } });

  useEffect(() => {
    if (!open) return;
    setServerError('');

    if (config.type === 'hierarchical') {
      masterService.options(config.parentSlug).then(setParentOptions).catch(() => setParentOptions([]));
    }

    if (editingRow) {
      reset({
        name_tamil: editingRow.name_tamil,
        name_english: editingRow.name_english,
        sort_order: editingRow.sort_order ?? 0,
        is_active: !!editingRow.is_active,
        ...(config.type === 'hierarchical' ? { [config.parentColumn]: editingRow[config.parentColumn] } : {}),
        ...(config.type === 'event'
          ? { event_date: editingRow.event_date || '', venue: editingRow.venue || '' }
          : {}),
      });
    } else {
      reset({
        name_tamil: '',
        name_english: '',
        sort_order: 0,
        is_active: true,
        ...(config.type === 'hierarchical' ? { [config.parentColumn]: lockedParentId || '' } : {}),
        ...(config.type === 'event' ? { event_date: '', venue: '' } : {}),
      });
    }
  }, [open, editingRow, config]);

  const onSubmit = async (values) => {
    setServerError('');
    setSubmitting(true);
    try {
      if (isEdit) {
        await masterService.update(config.slug, editingRow.id, values);
      } else {
        await masterService.create(config.slug, values);
      }
      onSaved();
    } catch (err) {
      if (err.errors) {
        Object.entries(err.errors).forEach(([field, message]) => setError(field, { message }));
      } else {
        setServerError(err.message || 'சேமிக்க முடியவில்லை');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{isEdit ? `${config.labelTa} திருத்து` : `புதிய ${config.labelTa}`}</DialogTitle>
      <DialogContent>
        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {config.type === 'hierarchical' && (
            <Controller
              name={config.parentColumn}
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label={config.parentLabelTa}
                  error={!!errors[config.parentColumn]}
                  helperText={errors[config.parentColumn]?.message}
                  disabled={!!lockedParentId}
                >
                  {parentOptions.map((opt) => (
                    <MenuItem key={opt.id} value={opt.id}>
                      {opt.name_tamil} ({opt.name_english})
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          )}

          <TextField
            fullWidth
            label="தமிழ் பெயர்"
            {...register('name_tamil')}
            error={!!errors.name_tamil}
            helperText={errors.name_tamil?.message}
            autoFocus
          />
          <TextField
            fullWidth
            label="ஆங்கில பெயர்"
            {...register('name_english')}
            error={!!errors.name_english}
            helperText={errors.name_english?.message}
          />

          {config.type === 'event' && (
            <>
              <TextField
                fullWidth
                type="date"
                label="தேதி"
                InputLabelProps={{ shrink: true }}
                {...register('event_date')}
                error={!!errors.event_date}
                helperText={errors.event_date?.message}
              />
              <TextField
                fullWidth
                label="இடம்"
                {...register('venue')}
                error={!!errors.venue}
                helperText={errors.venue?.message}
              />
            </>
          )}

          <TextField
            fullWidth
            type="number"
            label="வரிசை எண்"
            {...register('sort_order')}
            error={!!errors.sort_order}
            helperText={errors.sort_order?.message}
          />

          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                label="செயலில் உள்ளது"
              />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>ரத்து</Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={submitting}>
          {submitting ? 'சேமிக்கிறது...' : 'சேமி'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
