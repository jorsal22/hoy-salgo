
import React, { Component, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './src/config/supabase';
import { getUserEmail, isAdminUser } from './src/config/admin';
import { authCoordinator, isGoogleAuthCallback, processGoogleAuthCallback } from './src/services/googleAuthCallback';
import { parseRrppLink } from './src/services/rrppLinkService';
import AddEventScreen from './src/screens/AddEventScreen';
import AddClubScreen from './src/screens/AddClubScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import DataBankScreen from './src/screens/DataBankScreen';
import NightAssistantScreen from './src/screens/NightAssistantScreen';
import FixedClubsScreen from './src/screens/FixedClubsScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RrppScreen from './src/screens/RrppScreen';

const SESSION_RESTORE_TIMEOUT_MS = 8000;

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || String(error) };
  }

  componentDidCatch(error) {
    console.error('App crashed:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#0F172A' }}>
          <Text style={{ color: '#FDA4AF', fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
            Ocurrió un error
          </Text>
          <Text style={{ color: '#CBD5E1', fontSize: 12, marginTop: 12, textAlign: 'center' }}>
            {this.state.message}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [screen, setScreen] = useState('home');
  const [favoritesBackScreen, setFavoritesBackScreen] = useState('home');
  const [showLogin, setShowLogin] = useState(false);
  const [clubToEdit, setClubToEdit] = useState(null);
  const [eventPrefill, setEventPrefill] = useState(null);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [homeRefreshKey, setHomeRefreshKey] = useState(0);
  const [referral, setReferral] = useState(null);
  const pendingRrpp = useRef(false);

  const handleAuthenticatedSession = useCallback((nextSession) => {
    setSession(nextSession);
    setShowLogin(false);
    if (nextSession && pendingRrpp.current) {
      pendingRrpp.current = false;
      setScreen('rrpp');
    }
    if (!nextSession) setClubToEdit(null);
  }, []);

  useEffect(() => {
    const handleUrl = (url) => {
      if (!url) return;
      try {
        const nextReferral = parseRrppLink(url);
        if (!nextReferral) return;
        setReferral(nextReferral);
        setScreen('home');
      } catch (error) {
        console.error('No se pudo procesar el enlace:', error);
        Alert.alert('Enlace inválido', error.message || 'No se pudo abrir el enlace.');
      }
    };
    Linking.getInitialURL().then(handleUrl).catch((error) => {
      console.error('No se pudo leer el enlace inicial:', error);
    });
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let isMounted = true;
    let receivedAuthEvent = false;
    let sessionRestoreTimeout;

    const finishSessionCheck = () => {
      if (!isMounted) return;
      clearTimeout(sessionRestoreTimeout);
      setCheckingSession(false);
    };

    // Este manejo queda reservado para callbacks recibidos
    // al abrir la aplicación desde un enlace externo.
    // El login iniciado desde LoginScreen procesa su propio callback.
    const initialCallback = Linking.getInitialURL()
      .then((url) => {
        if (url && isGoogleAuthCallback(url)) {
          return processGoogleAuthCallback(url);
        }
      })
      .catch((error) => {
        console.error('No se pudo procesar el enlace inicial de Google:', error);
        Alert.alert(
          'Error de Google',
          error.message || 'No se pudo completar el acceso.'
        );
      });
    authCoordinator.setInitialCallback(initialCallback);

    const authState = supabase.auth.onAuthStateChange((event, nextSession) => {
      receivedAuthEvent = true;

      if (isMounted) {
        if (nextSession) {
          if (event === 'SIGNED_IN') {
            handleAuthenticatedSession(nextSession);
          } else {
            setSession(nextSession);
          }
        } else {
          setSession(null);

          if (event === 'SIGNED_OUT') {
            setClubToEdit(null);
            setScreen('home');
            setShowLogin(false);
          }
        }

        finishSessionCheck();
      }
    });

    const subscription = authState?.data?.subscription;

    sessionRestoreTimeout = setTimeout(() => {
      if (isMounted && !receivedAuthEvent) {
        console.warn('La restauración de la sesión tardó demasiado; se continúa como invitado.');
        setCheckingSession(false);
      }
    }, SESSION_RESTORE_TIMEOUT_MS);

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) throw error;
      if (!isMounted) return;

      if (!receivedAuthEvent) setSession(data?.session ?? null);
      finishSessionCheck();
    }).catch((error) => {
      console.error('No se pudo restaurar la sesión:', error);
      finishSessionCheck();
    });

    return () => {
      isMounted = false;
      clearTimeout(sessionRestoreTimeout);
      subscription?.unsubscribe();
    };
  }, [handleAuthenticatedSession]);

  if (checkingSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F43F5E" />
      </View>
    );
  }

  const isAdmin = isAdminUser(session?.user);

  const handleCreateEvent = (prefill = null, existingEvent = null) => {
    if (!session) {
      setShowLogin(true);
      return;
    }

    if (!isAdmin) {
      Alert.alert(
        'Cuenta sin permisos de administrador',
        `La sesión activa es ${getUserEmail(session.user) || 'sin correo'}. El administrador configurado es salsamendi.jorge@gmail.com.`
      );
      return;
    }

    setEventPrefill(existingEvent ? null : (prefill || null));
    setEventToEdit(existingEvent || null);
    setScreen('add-event');
  };

  const handleSignOut = async () => {
    if (!session) {
      setShowLogin(true);
      return;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setScreen('home');
    }
  };

  const handleCreateClub = () => {
    if (!session) {
      setShowLogin(true);
      return;
    }

    if (!isAdmin) {
      Alert.alert(
        'Cuenta sin permisos de administrador',
        `La sesión activa es ${getUserEmail(session.user) || 'sin correo'}. El administrador configurado es salsamendi.jorge@gmail.com.`
      );
      return;
    }

    setClubToEdit(null);
    setScreen('add-club');
  };

  const handleEditClub = (club) => {
    if (!session) {
      setShowLogin(true);
      return;
    }

    if (!isAdmin) {
      Alert.alert(
        'Cuenta sin permisos de administrador',
        `La sesión activa es ${getUserEmail(session.user) || 'sin correo'}. El administrador configurado es salsamendi.jorge@gmail.com.`
      );
      return;
    }

    setClubToEdit(club);
    setScreen('edit-club');
  };

  if (session && isAdmin && (screen === 'add-club' || screen === 'edit-club')) {
    return (
      <AddClubScreen
        key={screen === 'edit-club' ? clubToEdit?.id : 'new-club'}
        club={screen === 'edit-club' ? clubToEdit : null}
        onBack={() => {
          setClubToEdit(null);
          setScreen('clubs');
        }}
        onCreated={() => {
          setClubToEdit(null);
          setScreen('clubs');
        }}
      />
    );
  }

  if (session && screen === 'add-event' && isAdmin) {
    return (
      <AddEventScreen
        key={eventToEdit?.id ?? 'new'}
        onBack={() => {
          setEventPrefill(null);
          setEventToEdit(null);
          setScreen('home');
        }}
        onCreated={() => {
          setEventPrefill(null);
          setEventToEdit(null);
          setHomeRefreshKey((k) => k + 1);
          setScreen('home');
        }}
        prefill={eventPrefill}
        eventToEdit={eventToEdit}
      />
    );
  }

  if (session && isAdmin && screen === 'admin-dashboard') {
    return <AdminDashboardScreen onBack={() => setScreen('home')} />;
  }

  if (session && screen === 'rrpp') {
    return <RrppScreen userId={session.user.id} isAdmin={isAdmin} onBack={() => setScreen('home')} />;
  }

  if (!session && showLogin) {
    return (
      <LoginScreen
        onBack={() => {
          pendingRrpp.current = false;
          setShowLogin(false);
        }}
        onAuthenticated={handleAuthenticatedSession}
      />
    );
  }

  if (screen === 'assistant') {
    return <NightAssistantScreen onBack={() => setScreen('home')} />;
  }

  if (screen === 'databank') {
    return (
      <DataBankScreen
        onBack={() => setScreen('home')}
      />
    );
  }

  if (session && screen === 'favorites') {
    return (
      <FavoritesScreen
        userId={session.user.id}
        onBack={() => setScreen(favoritesBackScreen)}
        onSignIn={handleSignOut}
      />
    );
  }

  if (screen === 'clubs') {
    return (
      <FixedClubsScreen
        isAdmin={isAdmin}
        userId={session?.user?.id}
        onBack={() => setScreen('home')}
        onAddClub={isAdmin ? handleCreateClub : null}
        onEditClub={handleEditClub}
        onSignIn={handleSignOut}
        onShowFavorites={() => {
          setFavoritesBackScreen('clubs');
          setScreen('favorites');
        }}
        onShowDataBank={() => setScreen('databank')}
      />
    );
  }

  return (
    <HomeScreen
      key={homeRefreshKey}
      onCreateEvent={isAdmin ? handleCreateEvent : undefined}
      onCreateClub={isAdmin ? handleCreateClub : undefined}
      onShowClubs={() => setScreen('clubs')}
      onShowFavorites={() => {
        setFavoritesBackScreen('home');
        setScreen('favorites');
      }}
      onShowDataBank={() => setScreen('databank')}
      onShowAssistant={() => setScreen('assistant')}
      onShowDashboard={isAdmin ? () => setScreen('admin-dashboard') : undefined}
      onShowRrpp={() => {
        if (!session) {
          pendingRrpp.current = true;
          setShowLogin(true);
        }
        else setScreen('rrpp');
      }}
      referral={referral}
      onClearReferral={() => setReferral(null)}
      accountEmail={getUserEmail(session?.user)}
      userId={session?.user?.id}
      isAdmin={isAdmin}
      isAuthenticated={Boolean(session)}
      onSignOut={handleSignOut}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
