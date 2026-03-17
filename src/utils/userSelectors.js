import { getAuthState, getAuthUserId } from '@/lib/auth-store';

// Centralized user selectors kept as lightweight compatibility helpers.

export const selectUserId = () => {
  return getAuthUserId() || null;
};

export const selectUser = () => {
  return getAuthState().user || null;
};

export const selectIsAuthenticated = () => {
  const userId = selectUserId();
  const user = selectUser();
  return !!(userId && user);
};

export const selectUserInfo = () => {
  const user = selectUser();
  const userId = selectUserId();

  return {
    userId,
    user,
    isAuthenticated: !!(userId && user),
    name: user?.name || user?.firstName || '',
    email: user?.email || '',
    avatar: user?.avatar || user?.avatarUrl || '',
  };
};
