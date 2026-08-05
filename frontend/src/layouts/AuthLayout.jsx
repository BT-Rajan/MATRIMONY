import { Box, Paper, Typography, Container } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import KolamDivider from '../components/common/KolamDivider';
import { palette } from '../theme/theme';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(180deg, ${palette.maroonDark} 0%, ${palette.maroon} 42%, ${palette.ivory} 42%)`,
      }}
    >
      <Box sx={{ pt: { xs: 4, sm: 6 }, pb: 2, textAlign: 'center', color: '#fff' }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            mx: 'auto',
            mb: 1.5,
            borderRadius: '50%',
            bgcolor: 'secondary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FavoriteIcon sx={{ color: palette.maroonDark }} />
        </Box>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          கார்காத்தார் மங்கள சந்திப்பு
        </Typography>
        <Typography variant="subtitle2" sx={{ opacity: 0.85, letterSpacing: 1 }}>
          குரோம்பேட்டை
        </Typography>
      </Box>

      <Container maxWidth="xs" sx={{ flex: 1, display: 'flex', alignItems: 'flex-start', pb: 6 }}>
        <Paper elevation={0} sx={{ width: '100%', borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          <KolamDivider />
          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            {title && (
              <Typography variant="h5" sx={{ mb: 0.5, color: 'primary.main' }}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {subtitle}
              </Typography>
            )}
            {children}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
