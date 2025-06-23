module.exports = {
  apps: [
    {
      name: 'openautomate-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/openautomate/frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_file: '.env.production',
      
      // Logging
      log_file: '/var/log/pm2/openautomate-frontend.log',
      out_file: '/var/log/pm2/openautomate-frontend-out.log',
      error_file: '/var/log/pm2/openautomate-frontend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      
      // Restart policy
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Health monitoring
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Environment-specific settings
      node_args: '--max-old-space-size=2048'
    }
  ]
}
