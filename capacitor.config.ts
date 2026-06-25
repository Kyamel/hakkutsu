import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'dev.hakkutsu.app',
  appName: 'Hakkutsu',
  webDir: 'dist-capacitor',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
}

export default config
