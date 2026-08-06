import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Paper, Stepper, Step, StepLabel, Typography, Button } from '@mui/material';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutlineOutlined';
import { useAuth } from '../../contexts/AuthContext';
import { registrationService } from '../../services/registrationService';
import Loader from '../../components/common/Loader';
import KolamDivider from '../../components/common/KolamDivider';
import Step1BioData from './steps/Step1BioData';
import Step2Horoscope from './steps/Step2Horoscope';
import Step3Family from './steps/Step3Family';
import Step4Reference from './steps/Step4Reference';
import Step5Event from './steps/Step5Event';

const STEP_LABELS = ['அடிப்படை விவரங்கள்', 'ஜாதகம்', 'குடும்பம்', 'பரிந்துரையாளர்', 'நிகழ்வு'];

export default function RegistrationWizard() {
  const { user, isAuthenticated, updateUser } = useAuth();
  const navigate = useNavigate();
  const isMemberSession = isAuthenticated && user?.role === 'member';

  const [loading, setLoading] = useState(isMemberSession);
  const [activeStep, setActiveStep] = useState(1);
  const [profile, setProfile] = useState(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!isMemberSession) {
      setLoading(false);
      return;
    }
    if ((user?.registration_step ?? 1) >= 6) {
      setCompleted(true);
      setLoading(false);
      return;
    }
    registrationService
      .me()
      .then((res) => {
        setProfile(res.data);
        setActiveStep(Math.min(res.data.member.registration_step, 5));
      })
      .finally(() => setLoading(false));
  }, [isMemberSession]);

  if (loading) return <Loader fullscreen />;

  if (completed) {
    return (
      <CenteredCard>
        <CheckCircleOutline color="success" sx={{ fontSize: 56, mb: 1 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>
          உங்கள் பதிவு ஏற்கனவே முடிக்கப்பட்டது
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          பதிவு எண்: {user?.registration_number} — நிர்வாகி அனுமதிக்காக காத்திருக்கிறது.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/dashboard')}>
          டாஷ்போர்டு செல்க
        </Button>
      </CenteredCard>
    );
  }

  const handleStep1Success = (sessionData) => {
    setActiveStep(2);
    setProfile({ member: { registration_step: 2 } });
    void sessionData;
  };

  const advanceTo = (step) => {
    updateUser({ registration_step: step });
    if (step >= 6) {
      setCompleted(true);
    } else {
      setActiveStep(step);
    }
  };

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', py: { xs: 3, sm: 5 } }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5" color="primary.main">
            புதிய பதிவு
          </Typography>
          <Typography variant="body2" color="text.secondary">
            கார்காத்தார் மங்கள சந்திப்பு — குரோம்பேட்டை
          </Typography>
        </Box>

        {isMemberSession && (
          <Stepper activeStep={activeStep - 1} alternativeLabel sx={{ mb: 4, flexWrap: 'wrap' }}>
            {STEP_LABELS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}

        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <KolamDivider />
          <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
            {!isMemberSession && <Step1BioData onSuccess={handleStep1Success} />}

            {isMemberSession && activeStep === 2 && (
              <Step2Horoscope
                defaults={mapHoroscope(profile?.horoscope)}
                onSuccess={advanceTo}
                onBack={() => {}}
              />
            )}
            {isMemberSession && activeStep === 3 && (
              <Step3Family defaults={profile?.family} onSuccess={advanceTo} onBack={() => setActiveStep(2)} />
            )}
            {isMemberSession && activeStep === 4 && (
              <Step4Reference defaults={profile?.reference} onSuccess={advanceTo} onBack={() => setActiveStep(3)} />
            )}
            {isMemberSession && activeStep === 5 && (
              <Step5Event defaults={mapEvent(profile?.event)} onSuccess={advanceTo} onBack={() => setActiveStep(4)} />
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

function mapHoroscope(h) {
  if (!h) return undefined;
  return { ...h, birth_time: h.birth_time?.slice(0, 5) };
}

function mapEvent(e) {
  if (!e) return { participating: 'no' };
  return e;
}

function CenteredCard({ children }) {
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 3 }}>
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, textAlign: 'center', maxWidth: 420 }}>
        {children}
      </Paper>
    </Box>
  );
}
