import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.udyam.ai',
  appName: 'Udyam AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
