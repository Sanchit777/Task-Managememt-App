import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const themes = {
  default: { // essentially the original indigo theme
    primary: '#3211d4',
    bgLight: '#f6f6f8',
    white: '#ffffff',
    slate900: '#0f172a',
    slate800: '#1e293b',
    slate700: '#334155',
    slate500: '#64748b',
    slate400: '#94a3b8',
    slate200: '#e2e8f0',
    slate50: '#f8fafc',
    emerald100: '#d1fae5',
    emerald700: '#047857',
    amber100: '#fef3c7',
    amber500: '#f59e0b',
    amber700: '#b45309',
    emerald50: '#ecfdf5',
    emerald600: '#059669',
    amber50: '#fffbeb',
    amber600: '#d97706',
    rose50: '#fff1f2',
    rose100: '#ffe4e6',
    rose600: '#e11d48',
  },
  yellow: {
    ...this?.default,
    primary: '#eab308',
    primaryLight: 'rgba(234, 179, 8, 0.1)',
  },
  black: {
    ...this?.default,
    primary: '#000000',
    primaryLight: 'rgba(0, 0, 0, 0.1)',
  },
  green: {
    ...this?.default,
    primary: '#16a34a',
    primaryLight: 'rgba(22, 163, 74, 0.1)',
  },
  white: {
    ...this?.default,
    primary: '#64748b', // Needs a contrasting color; using slate
    bgLight: '#ffffff',
    primaryLight: 'rgba(100, 116, 139, 0.1)',
  }
};

// Fill out defaults
['yellow', 'black', 'green', 'white'].forEach(t => {
  themes[t] = { ...themes.default, ...themes[t] };
});

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('default');

  const setAppTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  const COLORS = themes[currentTheme];

  return (
    <ThemeContext.Provider value={{ currentTheme, setAppTheme, COLORS }}>
      {children}
    </ThemeContext.Provider>
  );
};
