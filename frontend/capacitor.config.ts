import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.delsu.compass',
  appName: 'Compass',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      resize: 'none',
      style: 'light',
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#1944F1',
    },
  },
};

export default config;
