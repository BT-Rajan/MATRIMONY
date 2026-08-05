import { Box } from '@mui/material';

/**
 * A repeating kolam (rangoli) dot-and-curve motif, rendered in the
 * secondary (turmeric gold) colour. Used as a quiet cultural signature
 * on auth screens and section dividers — never as decoration elsewhere.
 */
export default function KolamDivider({ height = 18, opacity = 0.55 }) {
  return (
    <Box
      sx={{
        width: '100%',
        height,
        opacity,
        backgroundRepeat: 'repeat-x',
        backgroundSize: '36px 100%',
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='18' viewBox='0 0 36 18'%3E%3Cg fill='none' stroke='%23C9962C' stroke-width='1.4'%3E%3Ccircle cx='9' cy='9' r='2' fill='%23C9962C' stroke='none'/%3E%3Ccircle cx='27' cy='9' r='2' fill='%23C9962C' stroke='none'/%3E%3Cpath d='M9 9 C 13 2, 23 2, 27 9 C 23 16, 13 16, 9 9 Z'/%3E%3C/g%3E%3C/svg%3E\")",
      }}
    />
  );
}
