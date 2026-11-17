import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../config/supabase';
import { authCoordinator, processGoogleAuthCallback } from '../services/googleAuthCallback';

WebBrowser.maybeCompleteAuthSession();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ onBack, onAuthenticated }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const authInProgress = useRef(false);
  const normalizedEmail = email.trim().toLowerCase();

  const validateCredentials = () => {
    if (isRegistering && !name.trim()) {
      Alert.alert('Falta tu nombre', 'Ingresá cómo querés que te llamemos.');
      return false;
    }
    if (!emailPattern.test(normalizedEmail)) {
      Alert.alert('Revisá tu correo', 'Ingresá una dirección de correo válida.');
      return false;
    }
    if (isRegistering && password.length < 6) {
      Alert.alert('Contraseña muy corta', 'Usá al menos 6 caracteres.');
      return false;
    }
    if (!password) {
      Alert.alert('Falta tu contraseña', 'Ingresá tu contraseña para continuar.');
      return false;
    }
    return true;
  };

  const runAuth = async (operation) => {
    if (authInProgress.current) return;
    authInProgress.current = true;
    setLoading(true);
    try {
      await authCoordinator.runLogin(operation);
    } catch (error) {
      Alert.alert('No pudimos completar la operación', error.message || 'Probá de nuevo en unos segundos.');
    } finally {
      authInProgress.current = false;
      setLoading(false);
    }
  };

  const handleEmailAuth = () => {
    if (!validateCredentials()) return;
    return runAuth(async () => {
      if (!isRegistering) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error) throw error;
        if (!data.session) throw new Error('El acceso se completó sin una sesión activa.');
        onAuthenticated?.(data.session);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { data: { full_name: name.trim() } },
      });
      if (error) throw error;
      if (data.session) {
        onAuthenticated?.(data.session);
        Alert.alert('¡Bienvenido!', 'Tu cuenta está lista para explorar.');
      } else {
        Alert.alert('Revisá tu correo', 'Te enviamos un enlace para confirmar tu cuenta. Después, iniciá sesión.');
        setIsRegistering(false);
      }
    });
  };

  const handleGoogleLogin = () => runAuth(async () => {
    const redirectUri = AuthSession.makeRedirectUri({ scheme: 'saliofinde', path: 'auth/callback' });
    if (redirectUri.startsWith('exp://')) {
      throw new Error('El acceso con Google requiere la app instalada en un build de desarrollo o producción.');
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw error;
    if (!data?.url) throw new Error('Supabase no devolvió la dirección de Google.');
    if (!data.flowId) throw new Error('No se pudo preparar el acceso seguro con Google.');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri, { showInRecents: false });
    if (result.type === 'cancel' || result.type === 'dismiss') return;
    if (result.type !== 'success' || !result.url) throw new Error('Google no devolvió el enlace de autenticación.');

    await processGoogleAuthCallback(result.url, data.flowId);
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!sessionData?.session) throw new Error('Google autenticó, pero no se creó una sesión.');
    onAuthenticated?.(sessionData.session);
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {onBack ? (
            <TouchableOpacity accessibilityRole="button" onPress={onBack} disabled={loading} style={styles.backButton}>
              <Text style={styles.backText}>‹  Explorar como invitado</Text>
            </TouchableOpacity>
          ) : <View style={styles.topSpacer} />}

          <View style={styles.hero}>
            <View style={styles.brandMark}><Text style={styles.brandMarkText}>HS</Text></View>
            <Text style={styles.eyebrow}>MONTEVIDEO · URUGUAY</Text>
            <Text style={styles.title}>La noche{'\n'}empieza acá.</Text>
            <Text style={styles.subtitle}>Encontrá tu próximo plan y guardá tus favoritos.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{isRegistering ? 'Creá tu cuenta' : 'Qué bueno verte'}</Text>
            <Text style={styles.cardSubtitle}>{isRegistering ? 'Sumate y armá tus próximos planes.' : 'Ingresá para continuar con tus planes.'}</Text>

            {isRegistering ? (
              <View style={styles.field}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput style={styles.input} placeholder="Tu nombre" placeholderTextColor="#9299A8" value={name} onChangeText={setName} autoCapitalize="words" returnKeyType="next" />
              </View>
            ) : null}
            <View style={styles.field}>
              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput style={styles.input} placeholder="vos@correo.com" placeholderTextColor="#9299A8" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" value={email} onChangeText={setEmail} returnKeyType="next" />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput style={styles.input} placeholder="Al menos 6 caracteres" placeholderTextColor="#9299A8" secureTextEntry textContentType={isRegistering ? 'newPassword' : 'password'} value={password} onChangeText={setPassword} onSubmitEditing={handleEmailAuth} returnKeyType="go" />
            </View>

            <TouchableOpacity accessibilityRole="button" style={[styles.primaryButton, loading && styles.disabled]} onPress={handleEmailAuth} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>{isRegistering ? 'Crear cuenta' : 'Iniciar sesión'}  →</Text>}
            </TouchableOpacity>

            <View style={styles.separator}><View style={styles.separatorLine} /><Text style={styles.separatorText}>o seguí con</Text><View style={styles.separatorLine} /></View>
            <TouchableOpacity accessibilityRole="button" style={[styles.googleButton, loading && styles.disabled]} onPress={handleGoogleLogin} disabled={loading}>
              <Text style={styles.googleG}>G</Text><Text style={styles.googleText}>Continuar con Google</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" onPress={() => setIsRegistering((value) => !value)} disabled={loading} style={styles.switchButton}>
              <Text style={styles.switchText}>{isRegistering ? '¿Ya tenés cuenta? ' : '¿Primera vez por acá? '}<Text style={styles.switchAccent}>{isRegistering ? 'Iniciá sesión' : 'Creá una cuenta'}</Text></Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.footer}>Planes que valen la pena. Noches para recordar.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#11131B' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 10, paddingBottom: 24, justifyContent: 'center' },
  topSpacer: { height: 34 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 10, marginBottom: 8 },
  backText: { color: '#B9BCC8', fontSize: 14, fontWeight: '600' },
  hero: { marginTop: 12, marginBottom: 27 },
  brandMark: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#F05A78', alignItems: 'center', justifyContent: 'center', marginBottom: 19 },
  brandMarkText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: -1 },
  eyebrow: { color: '#F27A91', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  title: { color: '#FFF', fontSize: 36, lineHeight: 40, fontWeight: '800', letterSpacing: -1.1, marginTop: 8 },
  subtitle: { color: '#A8ABB8', fontSize: 14, lineHeight: 21, marginTop: 9 },
  card: { backgroundColor: '#1B1E29', borderRadius: 22, borderWidth: 1, borderColor: '#292D3A', padding: 21 },
  cardTitle: { color: '#FFF', fontSize: 21, fontWeight: '700' },
  cardSubtitle: { color: '#A8ABB8', fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 20 },
  field: { marginBottom: 14 },
  label: { color: '#E4E5EB', fontSize: 12, fontWeight: '700', marginBottom: 7 },
  input: { minHeight: 50, borderRadius: 12, backgroundColor: '#12141D', borderWidth: 1, borderColor: '#303442', paddingHorizontal: 14, color: '#FFF', fontSize: 14 },
  primaryButton: { minHeight: 52, borderRadius: 13, backgroundColor: '#E94F70', alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  primaryText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  disabled: { opacity: 0.65 },
  separator: { flexDirection: 'row', alignItems: 'center', marginVertical: 17, gap: 10 },
  separatorLine: { height: 1, backgroundColor: '#343744', flex: 1 },
  separatorText: { color: '#858A99', fontSize: 11 },
  googleButton: { minHeight: 50, borderRadius: 13, backgroundColor: '#F6F6F8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  googleG: { color: '#4285F4', fontSize: 18, fontWeight: '900' },
  googleText: { color: '#242630', fontSize: 14, fontWeight: '700' },
  switchButton: { paddingTop: 18, alignItems: 'center' },
  switchText: { color: '#A8ABB8', fontSize: 12 },
  switchAccent: { color: '#FF8298', fontWeight: '800' },
  footer: { textAlign: 'center', color: '#757988', fontSize: 11, marginTop: 18 },
});
