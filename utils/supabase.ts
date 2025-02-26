import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const supabaseUrl = process.env.SUPABASE_URL;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// // console.log the supabaseUrl and supabaseAnonKey
// console.log('supabaseUrl', supabaseUrl);
// console.log('supabaseAnonKey exists:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key in Expo configuration.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
    },
  },
});
