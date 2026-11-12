import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import mediaRoutes from './routes/media.js';
import sessionRoutes from './routes/session.js';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/streamprime';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(
  cors({
    origin: [CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    exposedHeaders: ['x-session-id']
  })
);
app.use(express.json());
app.use(cookieParser());

// Request logging in dev
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api/media', mediaRoutes);
app.use('/api/session', sessionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongoConnected: mongoose.connection.readyState === 1
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

// Connect to MongoDB and start server
async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(' Successfully connected to MongoDB at:', MONGODB_URI);
  } catch (err) {
    console.warn(' MongoDB connection warning:', err.message);
    console.warn(' Continuing with in-memory session resilience.');
  }

  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` StreamPrime Server running on http://localhost:${PORT}`);
    console.log(` Client Origin: ${CLIENT_ORIGIN}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`===============================================`);
  });
}

startServer();
