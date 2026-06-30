import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.meufaturamento.app',
  appName: 'Meu Faturamento App',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    StatusBar: {
      overlaysWebView: true
    }
  }
};

export default config;
