import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined';
import AssessmentOutlined from '@mui/icons-material/AssessmentOutlined';
import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ROUTES } from '../utils/constants';

const DRAWER_WIDTH = 240;

const NAV_ITEMS = {
  admin: [
    { label: 'டாஷ்போர்டு', icon: <DashboardOutlined fontSize="small" />, path: ROUTES.ADMIN_DASHBOARD },
    { label: 'உறுப்பினர்கள்', icon: <PeopleAltOutlined fontSize="small" />, path: '/admin/members' },
    { label: 'அறிக்கைகள்', icon: <AssessmentOutlined fontSize="small" />, path: '/admin/reports' },
    { label: 'அறிவிப்புகள்', icon: <NotificationsOutlined fontSize="small" />, path: '/admin/notifications' },
    { label: 'மாஸ்டர் தரவு', icon: <TuneOutlined fontSize="small" />, path: '/admin/masters' },
  ],
  member: [{ label: 'என் டாஷ்போர்டு', icon: <DashboardOutlined fontSize="small" />, path: ROUTES.MEMBER_DASHBOARD }],
};

export default function MainLayout() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width:900px)');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const items = NAV_ITEMS[user?.role] || [];

  const handleLogout = () => {
    logout();
    toast.info('வெளியேறினீர்கள்');
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1 }}>
        <FavoriteIcon color="secondary" fontSize="small" />
        <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700, color: 'primary.main' }}>
          கார்காத்தார்
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1, px: 1, pt: 1 }}>
        {items.map((item) => (
          <ListItemButton
            key={item.path}
            onClick={() => {
              navigate(item.path);
              if (!isDesktop) setMobileOpen(false);
            }}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        color="inherit"
        sx={{
          bgcolor: '#fff',
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            edge="start"
            sx={{ display: { md: 'none' } }}
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {user?.role === 'admin' ? 'நிர்வாக பலகம்' : 'உறுப்பினர் பலகம்'}
          </Typography>
          <Box>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
                {(user?.name || user?.username || '?').slice(0, 1)}
              </Avatar>
            </IconButton>
            <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
              <MenuItem disabled>{user?.name || user?.username}</MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <LogoutOutlined fontSize="small" sx={{ mr: 1 }} /> வெளியேறு
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop ? true : mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none' },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
