import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths';
import path from 'path';

export default defineConfig(({ mode }) => {
  // depending on your application, base can also be "/"
  const env = loadEnv(mode, process.cwd(), '');
  const API_URL = `${env.VITE_APP_BASE_NAME}`;
  const PORT = 3000;

  return {
    server: {
      // this ensures that the browser opens upon server start
      open: true,
      // this sets a default port to 3000
      port: PORT,
      host: true
    },
    build: {
      chunkSizeWarningLimit: 1600
    },
    preview: {
      open: true,
      host: true
    },
    define: {
      global: 'window'
    },
    resolve: {
      alias: {
        App: path.resolve(__dirname, 'src/App'),
        serviceWorker: path.resolve(__dirname, 'src/serviceWorker'),
        reportWebVitals: path.resolve(__dirname, 'src/reportWebVitals'),
        contexts: path.resolve(__dirname, 'src/contexts'),
        assets: path.resolve(__dirname, 'src/assets'),
        components: path.resolve(__dirname, 'src/components'),
        hooks: path.resolve(__dirname, 'src/hooks'),
        layout: path.resolve(__dirname, 'src/layout'),
        pages: path.resolve(__dirname, 'src/pages'),
        routes: path.resolve(__dirname, 'src/routes'),
        store: path.resolve(__dirname, 'src/store'),
        themes: path.resolve(__dirname, 'src/themes'),
        ui: path.resolve(__dirname, 'src/ui'),
        utils: path.resolve(__dirname, 'src/utils'),
        views: path.resolve(__dirname, 'src/views'),
        api: path.resolve(__dirname, 'src/api'),
        menu: path.resolve(__dirname, 'src/menu'),
        'menu-items': path.resolve(__dirname, 'src/menu-items'),
        'ui-component': path.resolve(__dirname, 'src/ui-component'),
        config: path.resolve(__dirname, 'src/config'),
        '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs'
      }
    },
    base: API_URL,
    plugins: [react(), jsconfigPaths()]
  };
});
