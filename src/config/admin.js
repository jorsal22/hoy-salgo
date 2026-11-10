const ADMIN_EMAIL = 'salsamendi.jorge@gmail.com';

export const getUserEmail = (user) =>
  typeof user?.email === 'string' && user.email.trim() ? user.email : null;

export const isAdminUser = (user) =>
  typeof user?.email === 'string' &&
  user.email.trim().toLowerCase() === ADMIN_EMAIL;
