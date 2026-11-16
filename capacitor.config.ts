import type { CapacitorConfig } from '@capacitor/cli';

// Configuración de la app para celulares (Google Play y App Store).
// Capacitor empaqueta la misma app web (carpeta dist) dentro de una app nativa.
// OJO: appId no se puede cambiar después de publicar en las tiendas.
const config: CapacitorConfig = {
  appId: 'org.akahataorg.radar',
  appName: 'Radar Akãhatã',
  webDir: 'dist',
  backgroundColor: '#1a0516',
  android: {
    backgroundColor: '#1a0516',
  },
  ios: {
    backgroundColor: '#1a0516',
    contentInset: 'automatic',
  },
};

export default config;
