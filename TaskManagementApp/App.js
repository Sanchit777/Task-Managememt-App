import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/constants/ThemeContext';
import { AuthProvider } from './src/constants/AuthContext';
import api from './src/services/api';
import { requestPermissions } from './src/services/NotificationService';

export default function App() {
  useEffect(() => {
    // Request Notification Permissions
    requestPermissions();

    // Hidden "Warm-up" ping to wake up Render backend as early as possible
    api.get('/health').catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <PaperProvider>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
             <AppNavigator />
          </PaperProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
