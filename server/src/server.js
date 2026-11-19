import app from './app.js';
import { env } from './config/env.js';
import { connectDB, closeDB } from './config/db.js';

try {
  await connectDB();
} catch (err) {
  console.error(`Database connection failed: ${err.message}`);
  process.exit(1);
}

const server = app.listen(env.PORT, () => {
  console.log(`NovaCart API listening on port ${env.PORT} (${env.NODE_ENV})`);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => server.close(async () => { await closeDB(); process.exit(0); }));
}
