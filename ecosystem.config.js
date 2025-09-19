module.exports = {
  apps: [
    {
      name: 'studio',
      script: 'npm',
      args: 'start',
      cwd: process.cwd(),
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 9002
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001
      },
      // Configurações de logs
      error_file: './logs/studio-error.log',
      out_file: './logs/studio-out.log',
      log_file: './logs/studio-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Configurações de performance
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      
      // Configurações de restart
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // Configurações de watch (apenas em desenvolvimento)
      watch: process.env.NODE_ENV === 'development' ? ['src', 'pages', 'components'] : false,
      ignore_watch: [
        'node_modules',
        'logs',
        '.next',
        '.git',
        '*.log'
      ],
      
      // Configurações de cluster
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Variáveis de ambiente específicas
      env_file: '.env.production'
    }
  ],

  // Configurações de deploy
  deploy: {
    production: {
      user: 'deploy',
      host: 'seu-servidor.com',
      ref: 'origin/main',
      repo: 'https://github.com/seu-usuario/studio.git',
      path: '/var/www/studio',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci --only=production && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install git -y'
    },
    staging: {
      user: 'deploy',
      host: 'staging.seu-servidor.com',
      ref: 'origin/staging',
      repo: 'https://github.com/seu-usuario/studio.git',
      path: '/var/www/studio-staging',
      'post-deploy': 'npm ci --only=production && npm run build && pm2 reload ecosystem.config.js --env staging'
    }
  }
};
