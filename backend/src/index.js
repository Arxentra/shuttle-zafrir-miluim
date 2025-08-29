import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { pool } from './db/connection.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });


// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:5173',
    'https://dd71f7be0dd4.ngrok-free.app',
    'https://04c9687c2f38.ngrok-free.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// API Routes
app.use('/api/auth', (await import('./routes/auth.js')).default);
app.use('/api/companies', (await import('./routes/companies.js')).default);
app.use('/api/shuttles', (await import('./routes/shuttles.js')).default);
app.use('/api/schedules', (await import('./routes/schedules.js')).default);
app.use('/api/registrations', (await import('./routes/registrations.js')).default);
app.use('/api/admin', (await import('./routes/admin.js')).default);
app.use('/api/csv', (await import('./routes/csv.js')).default);

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  ws.on('message', (message) => {
    console.log('Received:', message.toString());
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  httpServer.close(() => {
    pool.end();
    console.log('Server closed');
  });
});

export { pool, wss };