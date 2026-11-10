export const normalizeInstagramUrl = (value) => {
  const input = typeof value === 'string' ? value.trim() : '';
  if (!input) return '';

  let username = input;
  if (/^(https?:\/\/)?(www\.)?instagram\.com\//i.test(input)) {
    try {
      const profileUrl = new URL(
        /^https?:\/\//i.test(input) ? input : `https://${input}`
      );
      if (!['instagram.com', 'www.instagram.com'].includes(profileUrl.hostname.toLowerCase())) return null;
      const segments = profileUrl.pathname.split('/').filter(Boolean);
      if (segments.length !== 1) return null;
      username = decodeURIComponent(segments[0]);
    } catch {
      return null;
    }
  } else if (input.includes('://') || input.includes('/')) {
    return null;
  }

  username = username.replace(/^@/, '');
  if (!/^[a-zA-Z0-9._]{1,30}$/.test(username) || username.startsWith('.') || username.endsWith('.') || username.includes('..')) {
    return null;
  }

  return `https://www.instagram.com/${username}/`;
};