
import { supabase } from '../config/supabase';

export const isGoogleAuthCallback = (value) => {
  try {
    const url = new URL(value);

    const isNative =
      url.protocol === 'saliofinde:' &&
      url.hostname === 'auth';

    const isExpoGo =
      url.protocol === 'exp:' &&
      url.pathname.endsWith('/auth/callback');

    return isNative || isExpoGo;
  } catch {
    return false;
  }
};

// Comparte la misma operación si App.js y LoginScreen.js
// reciben simultáneamente el mismo callback.
const processingCodes = new Map();

export const processGoogleAuthCallback = async (rawUrl) => {
  if (!isGoogleAuthCallback(rawUrl)) return false;

  const url = new URL(rawUrl);
  const params = new URLSearchParams(url.search);

  new URLSearchParams(url.hash.replace(/^#/, '')).forEach((value, key) => {
    if (!params.has(key)) {
      params.set(key, value);
    }
  });

  const oauthError =
    params.get('error_description') || params.get('error');

  if (oauthError) {
    throw new Error(oauthError);
  }

  const code = params.get('code');

  if (code) {
    // Si ya está en proceso, esperar la misma operación.
    if (processingCodes.has(code)) {
      return await processingCodes.get(code);
    }

    const exchangePromise = (async () => {
      const { error } =
        await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        throw error;
      }

      return true;
    })();

    processingCodes.set(code, exchangePromise);

    try {
      return await exchangePromise;
    } catch (error) {
      // Permite reintentar si el intercambio falló.
      processingCodes.delete(code);
      throw error;
    }
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      throw error;
    }

    return true;
  }

  throw new Error(
    'El callback de Google no trajo ni "code" ni tokens.'
  );
};
