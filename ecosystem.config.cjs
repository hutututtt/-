module.exports = {
  apps: [
    {
      name: 'autopilot-trader',
      script: 'src/index.ts',
      interpreter: 'node_modules/.bin/tsx',
      env: {
        TRADING_MODE: 'DRY_RUN'
      }
    }
  ]
};
