import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  
  // Inject environment variables to process.env so the serverless function ssrLoadModule can access them
  process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL;
  process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
  process.env.MERCADO_PAGO_ACCESS_TOKEN = env.MERCADO_PAGO_ACCESS_TOKEN;
  process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'mercado-pago-api-local',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url?.startsWith('/api/process-payment') && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const payload = JSON.parse(body);
                  const processPaymentModule = await server.ssrLoadModule('/api/process-payment.ts');
                  
                  const mockReq = {
                    method: 'POST',
                    body: payload,
                    headers: req.headers
                  };
                  
                  const mockRes = {
                    status(code: number) {
                      res.statusCode = code;
                      return this;
                    },
                    json(data: any) {
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify(data));
                      return this;
                    },
                    setHeader(name: string, value: string) {
                      res.setHeader(name, value);
                      return this;
                    },
                    end(val: string) {
                      res.end(val);
                      return this;
                    }
                  };

                  await processPaymentModule.default(mockReq, mockRes);
                } catch (err: any) {
                  console.error('Local process-payment error:', err);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message || 'Internal dev server error' }));
                }
              });
            } else if (req.url?.startsWith('/api/webhook') && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const payload = JSON.parse(body);
                  const webhookModule = await server.ssrLoadModule('/api/webhook.ts');
                  
                  const mockReq = {
                    method: 'POST',
                    body: payload,
                    headers: req.headers
                  };
                  
                  const mockRes = {
                    status(code: number) {
                      res.statusCode = code;
                      return this;
                    },
                    json(data: any) {
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify(data));
                      return this;
                    },
                    setHeader(name: string, value: string) {
                      res.setHeader(name, value);
                      return this;
                    },
                    end(val: string) {
                      res.end(val);
                      return this;
                    }
                  };

                  await webhookModule.default(mockReq, mockRes);
                } catch (err: any) {
                  console.error('Local webhook error:', err);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message || 'Internal dev server error' }));
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
