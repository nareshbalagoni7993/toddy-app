import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext({});

export const DARK = {
  mode: 'dark',
  bg: '#0d1f14',
  bgMedium: '#142a1c',
  bgLight: '#1e3d2a',
  bgCard: 'rgba(255,255,255,0.07)',
  bgCardStrong: 'rgba(255,255,255,0.12)',
  text: '#ffffff',
  textSec: 'rgba(255,255,255,0.75)',
  textMuted: 'rgba(255,255,255,0.45)',
  border: 'rgba(255,255,255,0.1)',
  borderStrong: 'rgba(255,255,255,0.2)',
  primary: '#2d8653',
  primaryLight: '#4caf7d',
  primaryDark: '#1a5c38',
  accent: '#f4c842',
  accentLight: '#ffd966',
  error: '#f44336',
  success: '#4caf50',
  warning: '#ff9800',
  tabBar: '#0d1f14',
  tabBorder: 'rgba(255,255,255,0.08)',
  headerBg: '#0d1f14',
  input: 'rgba(255,255,255,0.08)',
  inputBorder: 'rgba(255,255,255,0.15)',
  overlay: 'rgba(0,0,0,0.6)',
  shadow: 'rgba(45,134,83,0.3)',
  statusBar: 'light-content',
  gradBg: ['#0d1f14', '#142a1c'],
  gradHeader: ['#0d1f14', '#1a4a2e'],
  gradPrimary: ['#2d8653', '#1a5c38'],
  gradCard: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)'],
};

export const LIGHT = {
  mode: 'light',
  bg: '#f4faf6',
  bgMedium: '#e8f5ed',
  bgLight: '#ffffff',
  bgCard: 'rgba(0,0,0,0.04)',
  bgCardStrong: 'rgba(0,0,0,0.08)',
  text: '#0d1f14',
  textSec: 'rgba(13,31,20,0.7)',
  textMuted: 'rgba(13,31,20,0.45)',
  border: 'rgba(0,0,0,0.1)',
  borderStrong: 'rgba(0,0,0,0.2)',
  primary: '#2d8653',
  primaryLight: '#1a5c38',
  primaryDark: '#0f3320',
  accent: '#b8900a',
  accentLight: '#c9a020',
  error: '#d32f2f',
  success: '#388e3c',
  warning: '#f57c00',
  tabBar: '#ffffff',
  tabBorder: 'rgba(0,0,0,0.1)',
  headerBg: '#ffffff',
  input: 'rgba(0,0,0,0.05)',
  inputBorder: 'rgba(0,0,0,0.15)',
  overlay: 'rgba(0,0,0,0.5)',
  shadow: 'rgba(45,134,83,0.15)',
  statusBar: 'dark-content',
  gradBg: ['#e8f5ed', '#f4faf6'],
  gradHeader: ['#1a4a2e', '#2d8653'],
  gradPrimary: ['#2d8653', '#1a5c38'],
  gradCard: ['rgba(45,134,83,0.08)', 'rgba(45,134,83,0.03)'],
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('tc_theme').then((v) => {
      if (v !== null) setIsDark(v === 'dark');
    });
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    AsyncStorage.setItem('tc_theme', next ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme: isDark ? DARK : LIGHT, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
