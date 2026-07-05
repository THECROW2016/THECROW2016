import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { login as apiLogin, getSession, Profile } from './api';

type AuthContextType = {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const userId = localStorage.getItem('userId');
      if (userId) {
        try {
          const data = await getSession();
          setUser(data.user);
          setProfile(data.profile);
        } catch (error) {
          localStorage.removeItem('userId');
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const data = await apiLogin(email, password);
      setUser(data.user);
      setProfile(data.profile);
      localStorage.setItem('userId', data.user.id);
      return {};
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Login failed' };
    }
  };

  const signOut = () => {
    setUser(null);
    setProfile(null);
    localStorage.removeItem('userId');
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function hasRole(profile: Profile | null, roles: Profile['role'][]): boolean {
  if (!profile) return false;
  return roles.includes(profile.role);
}

export function isAdmin(profile: Profile | null): boolean {
  return hasRole(profile, ['superadmin', 'admin']);
}
