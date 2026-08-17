import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
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
        name: 'local-serverless-api-proxy',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url?.startsWith('/api/')) {
              const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
              const pathname = urlObj.pathname;
              const apiName = pathname.substring(5); // remove '/api/'
              
              const apiFilePath = path.resolve(__dirname, 'api', `${apiName}.ts`);
              
              if (!fs.existsSync(apiFilePath)) {
                return next();
              }

              // Parse query parameters
              const query: Record<string, string> = {};
              urlObj.searchParams.forEach((value, key) => {
                query[key] = value;
              });

              // Helper function to run the SSR module
              const executeModule = async (bodyPayload?: any) => {
                try {
                  const apiModule = await server.ssrLoadModule(`/api/${apiName}.ts`);
                  
                  const mockReq = {
                    method: req.method,
                    body: bodyPayload,
                    query,
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
                  
                  await apiModule.default(mockReq, mockRes);
                } catch (err: any) {
                  console.error(`Local API error for /api/${apiName}:`, err);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message || 'Internal dev server error' }));
                }
              };

              if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
                let body = '';
                req.on('data', chunk => { body += chunk; });
                req.on('end', () => {
                  let payload = {};
                  try {
                    if (body) {
                      payload = JSON.parse(body);
                    }
                  } catch (e) {
                    payload = body;
                  }
                  executeModule(payload);
                });
              } else {
                executeModule();
              }
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
