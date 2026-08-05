import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
import { Tabs, Tab, TextField, Button, Box, InputAdornment, IconButton, Alert } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonOutline from '@mui/icons-material/PersonOutlineOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import AuthLayout from '../../layouts/AuthLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { memberLoginSchema, adminLoginSchema } from '../../validators/authValidators';
import { ROUTES } from '../../utils/constants';

export default function Login() {
  const [tab, setTab] = useState('member');
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { loginMember, loginAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const isAdmin = tab === 'admin';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(isAdmin ? adminLoginSchema : memberLoginSchema),
    mode: 'onBlur',
  });

  const handleTabChange = (_e, value) => {
    setTab(value);
    setServerError('');
    reset();
  };

  const onSubmit = async (values) => {
    setServerError('');
    setSubmitting(true);
    try {
      if (isAdmin) {
        await loginAdmin(values);
        toast.success('நிர்வாகி உள்நுழைவு வெற்றி');
        navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
      } else {
        await loginMember({ identifier: values.identifier, password: values.password });
        toast.success('உள்நுழைவு வெற்றி');
        navigate(ROUTES.MEMBER_DASHBOARD, { replace: true });
      }
    } catch (err) {
      setServerError(err.message || 'உள்நுழைவு தோல்வியடைந்தது');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="உள்நுழைவு" subtitle="தொடர உங்கள் விவரங்களை உள்ளிடவும்">
      <Tabs value={tab} onChange={handleTabChange} variant="fullWidth" sx={{ mb: 3 }}>
        <Tab value="member" label="உறுப்பினர்" />
        <Tab value="admin" label="நிர்வாகி" />
      </Tabs>

      {serverError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {serverError}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {isAdmin ? (
          <TextField
            fullWidth
            label="பயனர் பெயர்"
            margin="normal"
            autoFocus
            {...register('username')}
            error={!!errors.username}
            helperText={errors.username?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutline fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        ) : (
          <TextField
            fullWidth
            label="மொபைல் எண் / மின்னஞ்சல்"
            margin="normal"
            autoFocus
            {...register('identifier')}
            error={!!errors.identifier}
            helperText={errors.identifier?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutline fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        )}

        <TextField
          fullWidth
          label="கடவுச்சொல்"
          type={showPassword ? 'text' : 'password'}
          margin="normal"
          {...register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlined fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" size="small">
                  {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={submitting}
          sx={{ mt: 3 }}
        >
          {submitting ? 'உள்நுழைகிறது...' : 'உள்நுழைக'}
        </Button>

        {!isAdmin && (
          <Button fullWidth variant="text" sx={{ mt: 1.5 }} onClick={() => navigate('/register')}>
            புதிய பதிவு செய்ய இங்கே கிளிக் செய்யவும்
          </Button>
        )}
      </Box>
    </AuthLayout>
  );
}
