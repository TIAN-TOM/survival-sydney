// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// Express app composition, shared middleware, route mounting, and API docs.
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';

import authRoutes from './routes/auth.routes';
import quizRoutes from './routes/quiz.routes';
import adminRoutes from './routes/admin.routes';
import errorHandler from './middleware/errorHandler';
import { fail, ok } from './utils/responseEnvelope';
import { setupSwagger } from './docs/swagger';
import { API_TITLE } from './config/brand';

const app = express();

// Only trust proxy headers when explicitly deployed behind one; trusting X-Forwarded-For
// unconditionally would let clients spoof their IP and bypass per-IP rate limits.
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());

app.get('/', (req, res) => {
  res.json(ok({
    message: API_TITLE,
    docs: '/api-docs',
    health: '/api/health',
  }));
});

app.get('/api/health', (req, res) => {
  res.json(ok({ status: 'ok' }));
});

// API docs expose the full schema surface; keep them out of production deployments.
if (process.env.NODE_ENV !== 'production') {
  setupSwagger(app);
}

app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json(fail('Route not found'));
});

app.use(errorHandler);

export default app;
