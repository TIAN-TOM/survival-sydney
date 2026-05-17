// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// Express app composition, shared middleware, route mounting, and API docs.
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const authRoutes = require('./routes/auth.routes');
const quizRoutes = require('./routes/quiz.routes');
const adminRoutes = require('./routes/admin.routes');
const errorHandler = require('./middleware/errorHandler');
const { fail, ok } = require('./utils/responseEnvelope');
const { setupSwagger } = require('./docs/swagger');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());

app.get('/', (req, res) => {
  res.json(ok({
    message: 'COMP5347 Quiz API',
    docs: '/api-docs',
    health: '/api/health',
  }));
});

app.get('/api/health', (req, res) => {
  res.json(ok({ status: 'ok' }));
});

setupSwagger(app);
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json(fail('Route not found', 404));
});

app.use(errorHandler);

module.exports = app;
