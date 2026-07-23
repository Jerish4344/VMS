import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AppState, Platform } from 'react-native';

/**
 * NetworkContext - provides real-time connectivity status across the app.
 * Uses fetch-based connectivity check (no extra dependency needed).
 * Checks connectivity on app foreground and periodically.
 */
const NetworkContext = createContext({
  isConnected: true,
  isInternetReachable: true,
});

const CONNECTIVITY_CHECK_URL = 'https://clients3.google.com/generate_204';
const CHECK_INTERVAL = 15000; // 15 seconds

export const NetworkProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const intervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  const checkConnectivity = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(CONNECTIVITY_CHECK_URL, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const connected = response.status === 204 || response.ok;
      setIsConnected(connected);
      setIsInternetReachable(connected);
    } catch (error) {
      setIsConnected(false);
      setIsInternetReachable(false);
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkConnectivity();

    // Periodic check
    intervalRef.current = setInterval(checkConnectivity, CHECK_INTERVAL);

    // Check when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        checkConnectivity();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      subscription?.remove();
    };
  }, [checkConnectivity]);

  return (
    <NetworkContext.Provider value={{ isConnected, isInternetReachable }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);

export default NetworkContext;
