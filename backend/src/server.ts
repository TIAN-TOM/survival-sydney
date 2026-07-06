// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// environment loading, database connection, and HTTP server startup.
import 'dotenv/config';

import app from './app';
import { getJwtSecret } from './config/auth';
import connectDb from './config/db';

const port = Number(process.env.PORT) || 5001;

// Surface otherwise-silent async failures instead of leaving the process in a bad state.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Fail fast at startup if the signing secret is missing/weak, before accepting traffic.
getJwtSecret();

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start backend', error);
    process.exit(1);
  });
