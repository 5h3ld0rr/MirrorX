const path = require('path');

const FRONTEND = path.resolve(__dirname, 'Frontend');
const BACKEND = path.resolve(__dirname, 'Backend');
const LOGS = path.resolve(__dirname, 'logs/pm2');

const isDev = process.argv.includes('--env') && process.argv.includes('dev');

module.exports = {
  apps: [
    {
      name: "frontend",
      cwd: FRONTEND,
      script: "node_modules/vite/bin/vite.js",
      args: isDev ? "" : "preview",
      env: {
        NODE_ENV: 'production',
      },
      env_dev: {
        NODE_ENV: 'development',
      },
      error_file: `${LOGS}/frontend-error.log`,
      out_file: `${LOGS}/frontend-out.log`,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
    },
    {
      name: "backend",
      cwd: BACKEND,
      script: isDev ? "node_modules/tsx/dist/cli.mjs" : "dist/server.js",
      args: isDev ? "watch src/server.ts" : "",
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        FRONTEND_URL: 'http://localhost:4173'
      },
      env_dev: {
        NODE_ENV: 'development',
        FRONTEND_URL: 'http://localhost:5173'
      },
      error_file: `${LOGS}/backend-error.log`,
      out_file: `${LOGS}/backend-out.log`,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
