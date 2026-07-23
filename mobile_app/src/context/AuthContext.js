import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api/authApi';
import gpsTrackingService from '../services/gpsTrackingService';
import { setCachedToken, clearCachedToken } from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('authToken');
      const storedUser = await SecureStore.getItemAsync('userData');
      
      if (storedToken && storedUser) {
        setCachedToken(storedToken);
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.log('Error loading stored auth:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authApi.login(username, password);
      
      const { token: authToken, user: userData } = response;
      
      await SecureStore.setItemAsync('authToken', authToken);
      await SecureStore.setItemAsync('userData', JSON.stringify(userData));
      
      setCachedToken(authToken);
      setToken(authToken);
      setUser(userData);
      
      return { success: true };
    } catch (e) {
      const errorMessage = e.response?.data?.detail || 
                          e.response?.data?.non_field_errors?.[0] ||
                          'Login failed. Please check your credentials.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Stop any active GPS tracking before clearing auth
      if (gpsTrackingService.isTrackingActive()) {
        console.log('Stopping GPS tracking on logout');
        await gpsTrackingService.stopTracking();
      }
    } catch (e) {
      console.log('Error stopping GPS on logout:', e);
    }

    try {
      await authApi.logout();
    } catch (e) {
      console.log('Logout API error:', e);
    } finally {
      clearCachedToken();
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('userData');
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = async (userData) => {
    setUser(userData);
    await SecureStore.setItemAsync('userData', JSON.stringify(userData));
  };

  const isAuthenticated = !!token && !!user;
  
  const isApproved = user?.approval_status === 'approved' || 
                     ['admin', 'manager', 'vehicle_manager'].includes(user?.user_type);

  const hasPermission = (permission) => {
    if (!user) return false;
    if (['admin', 'manager'].includes(user.user_type)) return true;
    return user.permissions?.includes(permission);
  };

  // Role checking helpers
  const isAdmin = ['admin', 'manager', 'vehicle_manager'].includes(user?.user_type);
  const isDriver = user?.user_type === 'driver';
  const isPersonalVehicleStaff = user?.user_type === 'personal_vehicle_staff';
  const isGeneratorUser = user?.user_type === 'generator_user';
  const isSORTeam = user?.user_type === 'sor_team';
  const isSORHead = user?.user_type === 'sor_head';
  const isSORUser = isSORTeam || isSORHead;

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isApproved,
    isAdmin,
    isDriver,
    isPersonalVehicleStaff,
    isGeneratorUser,
    isSORTeam,
    isSORHead,
    isSORUser,
    login,
    logout,
    updateUser,
    hasPermission,
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
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
