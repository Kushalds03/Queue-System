import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import tokenRoutes from './routes/tokenRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { config } from './config/index.js';

export const createApp = () => {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or Postman)
        if (!origin) return callback(null, true);
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check route for Render / monitoring
  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      service: 'QueueFlow API',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/queues', queueRoutes);
  app.use('/api/tokens', tokenRoutes);
  app.use('/api/analytics', analyticsRoutes);

  // 404 Route Handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint not found',
    });
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
};

export default createApp;
