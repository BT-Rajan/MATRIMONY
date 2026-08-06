import { Controller } from 'react-hook-form';
import { TextField, MenuItem } from '@mui/material';

export default function MasterSelect({ control, name, label, options, errors, disabled, helperText, required = true }) {
  const err = errors?.[name];
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          value={field.value ?? ''}
          select
          fullWidth
          label={label}
          disabled={disabled}
          error={!!err}
          helperText={err?.message || helperText}
          required={required}
        >
          <MenuItem value="">
            <em>தேர்ந்தெடுக்கவும்</em>
          </MenuItem>
          {options.map((opt) => (
            <MenuItem key={opt.id} value={opt.id}>
              {opt.name_tamil} ({opt.name_english})
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}
