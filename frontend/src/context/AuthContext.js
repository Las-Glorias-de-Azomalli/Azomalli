import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getStoredUser());
  const [token, setToken] = useState(() => authService.getStoredToken());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Validar el token existente contra el backend al montar
    const verifyToken = async () => {
      const storedToken = authService.getStoredToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const profileData = await authService.fetchProfile(storedToken);
        if (profileData && profileData.cuenta) {
          setUser(profileData.cuenta);
          setToken(storedToken);
        }
      } catch (err) {
        // Token inválido o expirado
        authService.logout();
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setToken(data.access_token);
    setUser(data.cuenta);
    return data;
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
