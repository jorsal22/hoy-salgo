
import React, { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "../config/supabase";
import { processGoogleAuthCallback } from "../services/googleAuthCallback";

WebBrowser.maybeCompleteAuthSession();

function waitForDeepLink(redirectBase, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    let done = false;
    let timer;
    let sub;

    const finish = (url, err) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      sub?.remove();
      if (err) reject(err);
      else resolve(url);
    };

    sub = Linking.addEventListener("url", ({ url }) => {
      if (url && url.startsWith(redirectBase)) finish(url);
    });

    Linking.getInitialURL()
      .then((url) => {
        if (url && url.startsWith(redirectBase)) finish(url);
      })
      .catch(() => {});

    timer = setTimeout(() => {
      finish(
        null,
        new Error(
          "Google no redirigió a la app.\n\n" +
          "Verificá en Supabase → Authentication → URL Configuration → Redirect URLs:\n\n" +
          "saliofinde://auth/callback"
        )
      );
    }, timeoutMs);
  });
}

export default function LoginScreen({ onBack, onAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const authInProgress = useRef(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Atención", "Ingresá email y contraseña.");
      return;
    }

    if (authInProgress.current) return;

    authInProgress.current = true;
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (data.session) onAuthenticated?.(data.session);
    } catch (err) {
      Alert.alert("Error al ingresar", err.message);
    } finally {
      authInProgress.current = false;
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("Atención", "Ingresá email y contraseña.");
      return;
    }

    if (authInProgress.current) return;

    authInProgress.current = true;
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        onAuthenticated?.(data.session);
        Alert.alert("Cuenta creada", "Ya podés explorar los eventos.");
      } else {
        Alert.alert(
          "Revisá tu correo",
          "Confirmá tu cuenta y luego iniciá sesión."
        );
        setIsRegistering(false);
      }
    } catch (err) {
      Alert.alert("Error al registrarte", err.message);
    } finally {
      authInProgress.current = false;
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (authInProgress.current) return;

    authInProgress.current = true;
    setLoading(true);

    try {
      console.log("[GOOGLE 1] Iniciando OAuth");

      const redirectUri = AuthSession.makeRedirectUri({
        scheme: "saliofinde",
        path: "auth/callback",
      });

      console.log("[GOOGLE 2] Redirect URI:", redirectUri);

      if (redirectUri.startsWith("exp://")) {
        Alert.alert(
          "No disponible en Expo Go",
          "El ingreso con Google requiere el build instalado.\n\n" +
          "Agregá esta URL en Supabase → Authentication → URL Configuration → Redirect URLs:\n\n" +
          "saliofinde://auth/callback"
        );
        return;
      }

      console.log("[GOOGLE 3] Solicitando URL a Supabase");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      console.log("[GOOGLE 4] Respuesta OAuth recibida");
      console.log("[GOOGLE URL]", data?.url);

      if (error) throw error;

      console.log("[GOOGLE 5] URL recibida:", Boolean(data?.url));

      if (!data?.url) {
        throw new Error("Supabase no devolvió la URL de Google.");
      }

      const redirectBase = redirectUri.split("?")[0];

      // Escuchar el deep link antes de abrir el navegador.
      console.log("[GOOGLE 6] Preparando escucha del deep link");

      const deepLinkPromise = waitForDeepLink(redirectBase);

      console.log("[GOOGLE 7] Abriendo navegador");

      const browserResult = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUri,
        { showInRecents: false }
      );

      console.log(
        "[GOOGLE 8] Resultado navegador:",
        browserResult?.type
      );

      let callbackUrl = null;

      if (browserResult.type === "success" && browserResult.url) {
        callbackUrl = browserResult.url;
      } else if (browserResult.type === "cancel") {
        return;
      } else {
        console.log("[GOOGLE 9] Esperando deep link de Android");
        callbackUrl = await deepLinkPromise;
      }

      if (!callbackUrl) {
        throw new Error("No llegó la URL de callback de Google.");
      }

      console.log("[GOOGLE 10] Callback recibido");

      await processGoogleAuthCallback(callbackUrl);

      console.log("[GOOGLE 11] Callback procesado");

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!sessionData?.session) {
        throw new Error(
          "Google autenticó pero Supabase no creó la sesión.\n\n" +
          "Verificá en Supabase → Authentication → URL Configuration → Redirect URLs:\n\n" +
          redirectUri
        );
      }

      console.log("[GOOGLE 12] Sesión creada correctamente");

      onAuthenticated?.(sessionData.session);
    } catch (err) {
      console.error("[GOOGLE ERROR]", err);

      Alert.alert(
        "Error con Google",
        err.message || "No se pudo completar el ingreso con Google."
      );
    } finally {
      authInProgress.current = false;
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inner}
      >
        {onBack ? (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onBack}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>
              ‹ Ver eventos sin cuenta
            </Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.logo}>
          <Text style={styles.brandTitle}>Hoy Salgo</Text>
          <Text style={styles.brandSub}>
            La noche uruguaya en un solo lugar
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Correo Electrónico</Text>

          <TextInput
            style={styles.input}
            placeholder="ejemplo@correo.com"
            placeholderTextColor="#64748B"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Contraseña</Text>

          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#64748B"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.btn}
            onPress={isRegistering ? handleRegister : handleLogin}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading
                ? "Un momento..."
                : isRegistering
                ? "Crear cuenta"
                : "Iniciar Sesión"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <Text style={styles.googleBtnText}>
              {loading ? "Conectando..." : "🌐 Continuar con Google"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsRegistering(!isRegistering)}
            disabled={loading}
          >
            <Text style={styles.switchText}>
              {isRegistering
                ? "¿Ya tenés cuenta? Iniciá sesión"
                : "¿No tenés cuenta? Registrate"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  backBtn: {
    position: "absolute",
    top: 20,
    left: 24,
    zIndex: 1,
  },
  backText: {
    color: "#CBD5E1",
    fontSize: 14,
  },
  logo: {
    alignItems: "center",
    marginBottom: 36,
  },
  brandTitle: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "bold",
  },
  brandSub: {
    color: "#94A3B8",
    fontSize: 14,
    marginTop: 8,
  },
  form: {
    gap: 14,
  },
  label: {
    color: "#E2E8F0",
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#1E293B",
    borderRadius: 10,
    padding: 14,
    color: "#FFFFFF",
    fontSize: 15,
  },
  btn: {
    backgroundColor: "#E11D48",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  googleBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 4,
  },
  googleBtnText: {
    color: "#1E293B",
    fontSize: 15,
    fontWeight: "600",
  },
  switchText: {
    color: "#FDA4AF",
    textAlign: "center",
    marginTop: 12,
    fontSize: 14,
  },
});
