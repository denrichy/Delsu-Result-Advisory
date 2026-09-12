import { createContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const AuthContext = createContext(null);

async function fetchProfileData(userId) {
  try {
    const advRes = await fetch(`${import.meta.env.VITE_API_BASE}/auth/adviser-profile/${userId}`);
    const advData = await advRes.json();
    if (advData.found === true) {
      return { role: 'adviser', profile: advData };
    }

    const stuRes = await fetch(`${import.meta.env.VITE_API_BASE}/auth/student-profile/${userId}`);
    const stuData = await stuRes.json();
    if (stuData.found === true) {
      return { role: 'student', profile: stuData };
    }

    return { role: 'student', profile: null };
  } catch (err) {
    console.error('Network or unexpected error during role detection:', err);
    return { role: 'student', profile: null };
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const resolveSession = async (s) => {
    setSession(s);
    setUser(s?.user ?? null);
    if (s?.user?.id) {
      const { role, profile } = await fetchProfileData(s.user.id);
      setUserRole(role);
      setUserProfile(profile);
    } else {
      setUserRole(null);
      setUserProfile(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      resolveSession(session);
    });

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
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, userRole, userProfile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
