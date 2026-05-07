const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const connectDb = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health.routes');
const quizRoutes = require('./routes/quiz.routes');

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());

app.use('/api/health', healthRoutes);
app.use('/api/quiz', quizRoutes);

app.use(errorHandler);

if (require.main === module) {
  const port = process.env.PORT || 5001;

  connectDb()
    .then(() => {
      app.listen(port, () => {
        console.log(`Backend listening on port ${port}`);
      });
    })
    .catch((err) => {
      console.error('Failed to start backend', err);
      process.exit(1);
    });
}

module.exports = app;
