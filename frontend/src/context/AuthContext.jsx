import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const AuthContext = createContext(null);

// After a session is established, detect role and fetch profile.
async function fetchUserContext() {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE}/auth/me`);
    if (!response.ok) throw new Error(`Profile request failed with ${response.status}`);
    return response.json();
  } catch (err) {
    console.error('Network or unexpected error during role detection:', err);
    return { role: null, profile: null };
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'student' | 'adviser' | null
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const resolvedContextRef = useRef({ userId: null, role: null, profile: null });
  const contextRequestRef = useRef(null);

  const resolveSession = useCallback(async (s, force = false) => {
    setSession(s);
    setUser(s?.user ?? null);
    if (s?.user?.id) {
      const cached = resolvedContextRef.current;
      if (!force && cached.userId === s.user.id && cached.role) {
        setUserRole(cached.role);
        setUserProfile(cached.profile);
        setLoading(false);
        return cached;
      }

      if (!contextRequestRef.current) {
        contextRequestRef.current = fetchUserContext().finally(() => {
          contextRequestRef.current = null;
        });
      }
      const { role, profile } = await contextRequestRef.current;
      resolvedContextRef.current = { userId: s.user.id, role, profile };
      setUserRole(role);
      setUserProfile(profile);
      setLoading(false);
      return { role, profile };
    } else {
      resolvedContextRef.current = { userId: null, role: null, profile: null };
      setUserRole(null);
      setUserProfile(null);
    }
    setLoading(false);
    return { role: null, profile: null };
  }, []);

  useEffect(() => {
    // Check for an existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      resolveSession(session);
    });

    // Subscribe to auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        resolveSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [resolveSession]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    setUserProfile(null);
  };

  const refreshAuth = async (nextSession = session) => {
    if (nextSession?.user?.id) return resolveSession(nextSession, true);
    return { role: null, profile: null };
  };

  return (
    <AuthContext.Provider value={{ session, user, userRole, userProfile, loading, signOut, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
