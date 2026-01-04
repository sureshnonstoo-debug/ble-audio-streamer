import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.30e4cc3c80dd4fbf8e06bba38bff085b',
  appName: 'BLE Audio Stream',
  webDir: 'dist',
  server: {
    url: 'https://30e4cc3c-80dd-4fbf-8e06-bba38bff085b.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
