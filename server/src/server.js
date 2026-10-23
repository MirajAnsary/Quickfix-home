import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';
import { deliveryStatus } from './services/notify.service.js';

async function start() {
  await connectDB();
  const app = createApp();
  const server = app.listen(env.port, () => {
    const d = deliveryStatus();
    console.log(`[api] listening on http://localhost:${env.port} (${env.nodeEnv})`);
    console.log(`[otp] email:${d.email ? 'ON' : 'off'} sms:${d.sms ? 'ON' : 'off'} dev-console:${d.devConsole ? 'ON' : 'off'}`);
    if (!d.email && !d.sms && !d.devConsole) console.warn('[otp] No OTP delivery configured — registration and password reset will fail with 503.');
  });
  server.on('error', async (err) => {
    console.error(err.code === 'EADDRINUSE' ? `[api] port ${env.port} is already in use. Stop the other server or change PORT in .env.` : `[api] server error: ${err.message}`);
    await disconnectDB().catch(() => {});
    process.exit(1);
  });

  const shutdown = async (signal) => {
    console.log(`[api] ${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('[api] failed to start:', err.message);
  process.exit(1);
});
