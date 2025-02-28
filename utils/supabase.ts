import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const supabaseUrl = process.env.SUPABASE_URL;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key in Expo configuration.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
