import { createTheme } from '@mui/material/styles';

// Palette inspired by Tamil temple architecture & kumkum/turmeric ritual colours
// Kumkum maroon (primary), turmeric gold (accent), temple-lamp ivory (background)
const palette = {
  maroon: '#7A1F3D',
  maroonDark: '#5A1730',
  gold: '#C9962C',
  goldLight: '#E8C572',
  ivory: '#FBF6ED',
  ivoryDeep: '#F3EBDA',
  teal: '#155E5A',
  ink: '#2B2320',
  success: '#2E7D4F',
  error: '#B23A2E',
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: palette.maroon,
      dark: palette.maroonDark,
      light: '#9C3E5E',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: palette.gold,
      light: palette.goldLight,
      dark: '#A67A1E',
      contrastText: palette.ink,
    },
    background: {
      default: palette.ivory,
      paper: '#FFFFFF',
    },
    text: {
      primary: palette.ink,
      secondary: '#6B5C52',
    },
    success: { main: palette.success },
    error: { main: palette.error },
    divider: palette.ivoryDeep,
    teal: { main: palette.teal },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: '"Noto Sans Tamil", "Inter", "Segoe UI", sans-serif',
    h1: { fontFamily: '"Baloo Thambi 2", "Noto Sans Tamil", sans-serif', fontWeight: 700 },
    h2: { fontFamily: '"Baloo Thambi 2", "Noto Sans Tamil", sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Baloo Thambi 2", "Noto Sans Tamil", sans-serif', fontWeight: 600 },
    h4: { fontFamily: '"Baloo Thambi 2", "Noto Sans Tamil", sans-serif', fontWeight: 600 },
    h5: { fontFamily: '"Baloo Thambi 2", "Noto Sans Tamil", sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Baloo Thambi 2", "Noto Sans Tamil", sans-serif', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, paddingTop: 9, paddingBottom: 9 },
        containedPrimary: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 14px rgba(122,31,61,0.25)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: '0 1px 0 rgba(0,0,0,0.06)' },
      },
    },
  },
});

export default theme;
export { palette };
