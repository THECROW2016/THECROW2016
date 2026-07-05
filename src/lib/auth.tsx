import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSession, Profile } from './api';

type AuthContextType = {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auto-login with demo credentials (server handles this)
    const autoLogin = async () => {
      try {
        const data = await getSession();
        setUser(data.user);
        setProfile(data.profile);
      } catch (error) {
        console.error('Failed to get session:', error);
      } finally {
        setLoading(false);
      }
    };

    autoLogin();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
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
