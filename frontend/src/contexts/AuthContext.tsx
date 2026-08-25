import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import api, { setAuthTokens } from '../lib/api';
import { isAuthenticated, logout } from '../lib/auth';
import type { User } from '../lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  singleUserMode: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [singleUserMode, setSingleUserMode] = useState(false);
  const initializedRef = useRef(false);

  const refreshUser = async () => {
    // Check if setup is needed first (before auth check)
    try {
      const setupResponse = await api.get('/api/auth/setup-status');
      setSingleUserMode(Boolean(setupResponse.data.single_user_mode));
      if (setupResponse.data.single_user_mode) {
        const sessionResponse = await api.post('/api/auth/local-session');
        setAuthTokens(
          sessionResponse.data.access_token,
          sessionResponse.data.refresh_token
        );
        const userResponse = await api.get('/api/auth/me');
        setUser(userResponse.data);
        setLoading(false);
        return;
      }
      if (setupResponse.data.needs_setup) {
        setUser(null);
        // Don't redirect if already on the register page
        if (!window.location.pathname.startsWith('/register')) {
          // Don't set loading=false - we're redirecting, keep showing loading state
          window.location.href = '/register?setup=true';
          return;
        }
        // Already on register page, allow form to display
        setLoading(false);
        return;
      }
    } catch {
      // If setup-status check fails, continue with normal auth flow
    }

    if (!isAuthenticated()) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    logout();
    setUser(null);
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, singleUserMode, refreshUser, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
