import { supabase } from './supabaseClient';

const nativeFetch = window.fetch.bind(window);
const apiBase = import.meta.env.VITE_API_BASE;
let accessToken = null;
let sessionInitialized = false;

const initialSession = supabase.auth.getSession().then(({ data: { session } }) => {
  accessToken = session?.access_token || null;
  sessionInitialized = true;
});

supabase.auth.onAuthStateChange((_event, session) => {
  accessToken = session?.access_token || null;
  sessionInitialized = true;
});

window.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input?.url;
  if (!apiBase || !url?.startsWith(apiBase)) {
    return nativeFetch(input, init);
  }

  if (!sessionInitialized) await initialSession;
  if (!accessToken) {
    const { data: { session } } = await supabase.auth.getSession();
    accessToken = session?.access_token || null;
  }
  const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined));
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return nativeFetch(input, { ...init, headers });
};
