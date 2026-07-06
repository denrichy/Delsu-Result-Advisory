import { createContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const AuthContext = createContext(null);

// After a session is established, detect role by probing the adviser profile.
// If it returns 200 → 'adviser'. Otherwise → 'student'.
async function detectRole(userId) {
  try {
    // 1. Check adviser profile
    const advRes = await fetch(`${import.meta.env.VITE_API_BASE}/auth/adviser-profile/${userId}`);
    const advData = await advRes.json();
    if (advData.found === true) {
      return 'adviser';
    }

    // 2. Check student profile
    const stuRes = await fetch(`${import.meta.env.VITE_API_BASE}/auth/student-profile/${userId}`);
    const stuData = await stuRes.json();
    if (stuData.found === true) {
      return 'student';
    }

    return 'student'; // Default fallback
  } catch (err) {
    console.error('Network or unexpected error during role detection:', err);
    return 'student';
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'student' | 'adviser' | null
  const [loading, setLoading] = useState(true);

  const resolveSession = async (s) => {
    setSession(s);
    setUser(s?.user ?? null);
    if (s?.user?.id) {
      const role = await detectRole(s.user.id);
      setUserRole(role);
    } else {
      setUserRole(null);
    }
    setLoading(false);
  };

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
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, userRole, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
