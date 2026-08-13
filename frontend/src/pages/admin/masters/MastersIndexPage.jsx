import { Box, Typography, Grid, Paper, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { MASTER_CONFIG } from '../../../config/masterConfig';

const GROUPS = [
  { title: 'பதிவு தகவல்', slugs: ['educations', 'occupations', 'stars', 'rasis'] },
];

export default function MastersIndexPage() {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 0.5 }}>
        மாஸ்டர் தரவு மேலாண்மை
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        பதிவு படிவங்களில் தோன்றும் அனைத்து dropdown தேர்வுகளும் இங்கிருந்தே வருகின்றன.
      </Typography>

      {GROUPS.map((group) => (
        <Box key={group.title} sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            {group.title}
          </Typography>
          <Grid container spacing={2}>
            {group.slugs.map((slug) => {
              const cfg = MASTER_CONFIG.find((m) => m.slug === slug);
              if (!cfg) return null;
              return (
                <Grid item xs={12} sm={6} md={4} key={slug}>
                  <Paper
                    variant="outlined"
                    onClick={() => navigate(`/admin/masters/${slug}`)}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      '&:hover': { borderColor: 'primary.main', boxShadow: '0 2px 10px rgba(122,31,61,0.10)' },
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {cfg.labelTa}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {cfg.labelEn}
                    </Typography>
                    {cfg.type === 'hierarchical' && (
                      <Chip size="small" label={`${cfg.parentLabelTa} சார்ந்தது`} variant="outlined" />
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      ))}
    </Box>
  );
}
