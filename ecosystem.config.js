module.exports = {
  apps: [
    {
      name: 'koeln-branchen-backend',
      script: 'index.js',
      cwd: '/home/adtle/koelnbranchende/server',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false
    },
    {
      name: 'koeln-branchen-frontend',
      script: 'npx',
      args: 'serve -s dist -l 3000',
      cwd: '/home/adtle/koelnbranchende/client',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false
    }
  ]
};
