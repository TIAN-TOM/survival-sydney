// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// environment loading, database connection, and HTTP server startup.
require('dotenv').config();

const app = require('./app');
const { getJwtSecret } = require('./config/auth');
const connectDb = require('./config/db');

const port = process.env.PORT || 5001;

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
