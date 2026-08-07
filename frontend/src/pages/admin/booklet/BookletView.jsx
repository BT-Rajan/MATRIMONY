import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Stack, Alert } from '@mui/material';
import PrintOutlined from '@mui/icons-material/PrintOutlined';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import { bookletService } from '../../../services/bookletService';
import { apiFileUrl } from '../members/MembersListPage';
import Loader from '../../../components/common/Loader';
import QrCode from '../../../components/common/QrCode';
import { GENDER_LABELS } from '../../../utils/memberStatus';

const PRINT_STYLE = `
  @page { size: A4; margin: 16mm 14mm; }
  @media print {
    .no-print { display: none !important; }
    .booklet-page { page-break-after: always; }
    .booklet-page:last-child { page-break-after: auto; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  @media screen {
    .booklet-page {
      background: #fff;
      max-width: 794px;
      margin: 0 auto 24px auto;
      padding: 40px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.15);
      min-height: 1000px;
    }
  }
`;

export default function BookletView() {
  const location = useLocation();
  const navigate = useNavigate();
  const filters = location.state?.filters || {};

  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    bookletService
      .fetch(filters)
      .then((res) => setRows(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Loader fullscreen />;

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">பதிவேட்டில் காட்ட உறுப்பினர்கள் இல்லை</Typography>
        <Button sx={{ mt: 2 }} onClick={() => navigate(-1)}>
          திரும்பு
        </Button>
      </Box>
    );
  }

  const today = new Date().toLocaleDateString('ta-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Box sx={{ bgcolor: { xs: 'transparent', sm: '#e8e2d5' }, minHeight: '100vh', py: { xs: 0, sm: 3 } }}>
      <style>{PRINT_STYLE}</style>

      <Stack direction="row" spacing={2} className="no-print" sx={{ maxWidth: 794, mx: 'auto', mb: 2, px: { xs: 2, sm: 0 } }}>
        <Button startIcon={<ArrowBackOutlined />} onClick={() => navigate(-1)}>
          திரும்பு
        </Button>
        <Box sx={{ flex: 1 }} />
        <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
          {rows.length} உறுப்பினர்(கள்)
        </Typography>
        <Button variant="contained" startIcon={<PrintOutlined />} onClick={() => window.print()}>
          அச்சிடு / PDF ஆக சேமி
        </Button>
      </Stack>

      <Alert severity="info" className="no-print" sx={{ maxWidth: 794, mx: 'auto', mb: 2 }}>
        பக்க எண்களுக்கு: அச்சு சாளரத்தில் "மேலும் அமைப்புகள்" → "தலைப்புகள் மற்றும் அடிக்குறிப்புகள்" ஐ இயக்கவும் (Chrome: More settings → Headers and footers).
      </Alert>

      {/* ---------------- Cover page ---------------- */}
      <Box
        className="booklet-page"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <Typography variant="h3" sx={{ fontFamily: '"Baloo Thambi 2", sans-serif', color: 'primary.main', mb: 1 }}>
          கார்காத்தார் மங்கள சந்திப்பு
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
          குரோம்பேட்டை
        </Typography>
        <Typography variant="h5" sx={{ mb: 1 }}>
          உறுப்பினர் பதிவேடு
        </Typography>
        <Typography variant="body1" color="text.secondary">
          உருவாக்கப்பட்ட தேதி: {today}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          மொத்த உறுப்பினர்கள்: {rows.length}
        </Typography>
      </Box>

      {/* ---------------- Table of contents ---------------- */}
      <Box className="booklet-page">
        <Typography variant="h5" sx={{ mb: 3, color: 'primary.main', borderBottom: '2px solid', borderColor: 'divider', pb: 1 }}>
          பொருளடக்கம்
        </Typography>
        {rows.map((m, idx) => (
          <Box key={m.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px dotted #ccc' }}>
            <Typography variant="body2">
              {idx + 1}. {m.registration_number} — {m.name_tamil} ({m.name_english})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {GENDER_LABELS[m.gender] || m.gender}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* ---------------- One page per member ---------------- */}
      {rows.map((m) => (
        <Box key={m.id} className="booklet-page">
          <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
            <Box
              component="img"
              src={apiFileUrl(m.photo_path)}
              alt={m.name_english}
              sx={{ width: 140, height: 170, objectFit: 'cover', borderRadius: 1, border: '1px solid #ddd' }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5">{m.name_tamil}</Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
                {m.name_english}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                பதிவு எண்: {m.registration_number}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {GENDER_LABELS[m.gender] || m.gender} • {m.age ? `${m.age} வயது` : '-'}
              </Typography>
            </Box>
            <QrCode value={`KARKATHAR|${m.registration_number}|${m.name_english}`} size={90} />
          </Box>

          <BookletGrid
            items={[
              ['உயரம் / எடை', `${m.height_cm || '-'} cm / ${m.weight_kg || '-'} kg`],
              ['திருமண நிலை', m.marital_status || '-'],
              ['கல்வி', m.education_tamil ? `${m.education_tamil} (${m.education_english})` : '-'],
              ['தொழில்', m.occupation_tamil ? `${m.occupation_tamil} (${m.occupation_english})` : '-'],
              ['மதம்', m.religion_tamil ? `${m.religion_tamil} (${m.religion_english})` : '-'],
              ['சாதி', m.caste_tamil ? `${m.caste_tamil} (${m.caste_english})` : '-'],
              ['மாவட்டம்', m.district_tamil ? `${m.district_tamil} (${m.district_english})` : '-'],
              ['சொந்த ஊர்', m.native_place || '-'],
              ['நட்சத்திரம்', m.star_tamil ? `${m.star_tamil} (${m.star_english})` : '-'],
              ['ராசி', m.rasi_tamil ? `${m.rasi_tamil} (${m.rasi_english})` : '-'],
              ['தோஷம்', m.dosham_tamil ? `${m.dosham_tamil} (${m.dosham_english})` : '-'],
              ['மாநிலம் / நாடு', `${m.state || '-'}, ${m.country || '-'}`],
            ]}
          />
        </Box>
      ))}
    </Box>
  );
}

function BookletGrid({ items }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
      {items.map(([label, value]) => (
        <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', py: 0.75 }}>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500, textAlign: 'right' }}>
            {value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
