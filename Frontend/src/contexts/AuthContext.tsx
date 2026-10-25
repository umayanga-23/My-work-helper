import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, UserProfile } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  demoVisitorName: string | null;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  enterDemoMode: (visitorName: string) => Promise<void>;
  logout: () => void;
  exitDemoMode: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('app_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('app_auth_token') || null;
  });

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('app_demo_mode') === 'true';
  });

  const [demoVisitorName, setDemoVisitorName] = useState<string | null>(() => {
    return localStorage.getItem('app_demo_visitor_name') || null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync state to LocalStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('app_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('app_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('app_auth_token', token);
    } else {
      localStorage.removeItem('app_auth_token');
    }
  }, [token]);

  useEffect(() => {
    localStorage.setItem('app_demo_mode', isDemoMode ? 'true' : 'false');
    if (demoVisitorName) {
      localStorage.setItem('app_demo_visitor_name', demoVisitorName);
    } else {
      localStorage.removeItem('app_demo_visitor_name');
    }
  }, [isDemoMode, demoVisitorName]);

  const login = async (usernameOrEmail: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login(usernameOrEmail, password);
      setUser(response.user);
      setToken(response.token);
      setIsDemoMode(false);
      setDemoVisitorName(null);
    } finally {
      setIsLoading(false);
    }
  };

  const enterDemoMode = async (visitorName: string) => {
    setIsDemoMode(true);
    setDemoVisitorName(visitorName);
    setUser(null);
    setToken(null);

    // Parse platform info
    const ua = navigator.userAgent;
    let deviceType = 'Desktop';
    if (/Mobi|Android/i.test(ua)) deviceType = 'Mobile';
    else if (/Tablet|iPad/i.test(ua)) deviceType = 'Tablet';

    let browser = 'Browser';
    if (/Chrome/i.test(ua)) browser = 'Chrome';
    else if (/Safari/i.test(ua)) browser = 'Safari';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';
    else if (/Edg/i.test(ua)) browser = 'Edge';

    let os = 'OS';
    if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Mac/i.test(ua)) os = 'macOS';
    else if (/Linux/i.test(ua)) os = 'Linux';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/iPhone|iPad/i.test(ua)) os = 'iOS';

    // Telemetry ping in background (non-blocking)
    try {
      await authService.logDemoVisitor({
        name: visitorName,
        deviceType,
        browser,
        os,
      });
    } catch (err) {
      console.warn('Telemetry ping silently skipped:', err);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsDemoMode(false);
    setDemoVisitorName(null);
    localStorage.clear();
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    setDemoVisitorName(null);
    localStorage.removeItem('app_demo_mode');
    localStorage.removeItem('app_demo_visitor_name');
  };

  const updateProfile = (updated: Partial<UserProfile>) => {
    if (user) {
      setUser({ ...user, ...updated });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token && !isDemoMode,
        isDemoMode,
        demoVisitorName,
        isLoading,
        login,
        enterDemoMode,
        logout,
        exitDemoMode,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
