export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/matrimony/backend/api';

export const TOKEN_KEY = 'karkathar_access_token';
export const USER_KEY = 'karkathar_user';

export const ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
};

export const ROUTES = {
  LOGIN: '/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  MEMBER_DASHBOARD: '/dashboard',
};
