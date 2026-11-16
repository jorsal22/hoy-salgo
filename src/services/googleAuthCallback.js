
import { supabase } from '../config/supabase';
import { createAuthCoordinator, resolveCallbackFlowId } from './authCoordinator';

export const authCoordinator = createAuthCoordinator(supabase.auth);

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

export const processGoogleAuthCallback = async (rawUrl, flowId) => {
  console.log('[GOOGLE CALLBACK] Iniciando procesamiento');

  if (!isGoogleAuthCallback(rawUrl)) {
    console.log('[GOOGLE CALLBACK] URL no reconocida');
    return false;
  }

  const url = new URL(rawUrl);
  const params = new URLSearchParams(url.search);

  new URLSearchParams(url.hash.replace(/^#/, '')).forEach(
    (value, key) => {
      if (!params.has(key)) {
        params.set(key, value);
      }
    }
  );

  const oauthError =
    params.get('error_description') || params.get('error');

  if (oauthError) {
    console.error('[GOOGLE CALLBACK] Error OAuth:', oauthError);
    throw new Error(oauthError);
  }

  const code = params.get('code');

  console.log('[GOOGLE CALLBACK] Código recibido:', !!code);

  if (code) {
    console.log('[PKCE] Iniciando exchangeCodeForSession');
    const callbackFlowId = resolveCallbackFlowId(params.get('sb_flow_id'), flowId);
    return authCoordinator.exchangeCode(code, callbackFlowId);
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (accessToken && refreshToken) {
    console.log('[GOOGLE CALLBACK] Callback con tokens');

    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      console.error('[GOOGLE CALLBACK] Error al establecer sesión:', error.message);
      throw error;
    }

    console.log('[GOOGLE CALLBACK] Sesión establecida');
    return true;
  }

  console.error('[GOOGLE CALLBACK] No se recibió código ni tokens');

  throw new Error(
    'El callback de Google no trajo ni "code" ni tokens.'
  );
};
