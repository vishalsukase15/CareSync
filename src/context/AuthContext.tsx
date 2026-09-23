import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { User, PatientProfile, DoctorProfile } from '../types/index.js';

interface AuthContextType {
  user: User | null;
  profile: PatientProfile | DoctorProfile | any;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const data = await api.get<{ user: User; profile: any }>('/auth/me');
      setUser(data.user);
      setProfile(data.profile);
    } catch (err) {
      setUser(null);
      setProfile(null);
      localStorage.removeItem('caresync_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.post<{ user: User; token: string }>('/auth/login', credentials);
    if (res.token) {
      localStorage.setItem('caresync_token', res.token);
    }
    await fetchCurrentUser();
    return res.user;
  };

  const register = async (data: any) => {
    const res = await api.post<{ user: User; token: string }>('/auth/register', data);
    if (res.token) {
      localStorage.setItem('caresync_token', res.token);
    }
    await fetchCurrentUser();
    return res.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('caresync_token');
      setUser(null);
      setProfile(null);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        register,
        logout,
        updateUser,
        refreshUser: fetchCurrentUser
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
