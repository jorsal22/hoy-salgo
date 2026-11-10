import { supabase } from '../config/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

// Importante para cerrar correctamente la sesión del navegador en móviles
WebBrowser.maybeCompleteAuthSession();

export const authService = {
  // Registro con Email y Contraseña
  async signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });
    if (error) throw error;
    return data;
  },

  // Login con Email y Contraseña
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // La mejor forma para Google OAuth con Expo y Supabase
  async signInWithGoogle() {
    try {
      // 1. Generamos la URI de redirección para Expo
      const redirectTo = AuthSession.makeRedirectUri({
        scheme: 'saliofinde', 
        path: 'auth/callback',
      });

      console.log('Redirect URI:', redirectTo);

      // 2. Solicitamos la URL de autenticación a Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      // 3. Abrimos el navegador interactivo
      const res = await WebBrowser.openAuthSessionAsync(
        data?.url,
        redirectTo
      );

      // 4. Si el usuario completa el login, extraemos los tokens de la URL
      if (res.type === 'success' && res.url) {
        const urlParams = new URL(res.url);
        const queryParams = new URLSearchParams(urlParams.search);
        let accessToken = queryParams.get('access_token');
        let refreshToken = queryParams.get('refresh_token');

        // Si no están en query params, buscamos en el hash
        if (!accessToken && urlParams.hash) {
          const hashParams = new URLSearchParams(urlParams.hash.replace('#', ''));
          accessToken = hashParams.get('access_token');
          refreshToken = hashParams.get('refresh_token');
        }

        if (accessToken && refreshToken) {
          // 5. Inyectamos los tokens en Supabase para activar la sesión
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) throw sessionError;
          return { success: true };
        } else {
          throw new Error('No se pudieron recuperar los tokens de Google.');
        }
      }
      
      return { success: false, cancelled: true };
    } catch (error) {
      console.log('Error en Google Auth:', error.message);
      throw error;
    }
  },

  // Cerrar sesión
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};