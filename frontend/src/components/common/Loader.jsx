import { Backdrop, CircularProgress, Box, Typography } from '@mui/material';

/**
 * fullscreen: blocking overlay loader (page-level async work)
 * inline: small spinner for buttons/cards
 */
export default function Loader({ fullscreen = false, label = 'ஏற்றுகிறது...', size = 32 }) {
  if (fullscreen) {
    return (
      <Backdrop
        open
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 10,
          backgroundColor: 'rgba(43,35,32,0.55)',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        <CircularProgress color="inherit" size={size} />
        <Typography variant="body2">{label}</Typography>
      </Backdrop>
    );
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
      <CircularProgress size={size} />
    </Box>
  );
}
