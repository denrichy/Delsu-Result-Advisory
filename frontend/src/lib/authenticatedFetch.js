import { supabase } from './supabaseClient';

const nativeFetch = window.fetch.bind(window);
const apiBase = import.meta.env.VITE_API_BASE;

window.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input?.url;
  if (!apiBase || !url?.startsWith(apiBase)) {
    return nativeFetch(input, init);
  }

  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined));
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  return nativeFetch(input, { ...init, headers });
};
