import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://zdhwazbuuvugyylrisun.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9Weogm4YbgH1TEN-HN3Nbw_PiqgV2aB';

// flowType: 'pkce' es necesario para OAuth con deep-link en React Native.
// El callback maneja el intercambio de code → session con exchangeCodeForSession.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});