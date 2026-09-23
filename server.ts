import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './server/routes/auth.js';
import doctorsRoutes from './server/routes/doctors.js';
import hospitalsRoutes from './server/routes/hospitals.js';
import appointmentsRoutes from './server/routes/appointments.js';
import medicalRecordsRoutes from './server/routes/medicalRecords.js';
import prescriptionsRoutes from './server/routes/prescriptions.js';
import consultationsRoutes from './server/routes/consultations.js';
import chatRoutes from './server/routes/chat.js';
import notificationsRoutes from './server/routes/notifications.js';
import adminRoutes from './server/routes/admin.js';
import { setupWebSocketServer } from './server/sockets/signaling.js';

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Basic security and parsing middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Health check endpoint (As required in Section 35)
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    platform: 'CareSync Healthcare Network',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// Mount API Routers
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/hospitals', hospitalsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/medical-records', medicalRecordsRoutes);
app.use('/api/prescriptions', prescriptionsRoutes);
app.use('/api/consultations', consultationsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);

// Centralized error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API Error]', err);
  const status = err.status || 500;
  const message = err.message || 'An internal healthcare system error occurred.';
  res.status(status).json({ error: message });
});

async function startServer() {
  const server = http.createServer(app);

  // Setup real-time WebSocket & WebRTC signaling
  setupWebSocketServer(server);

  if (!isProduction) {
    // Development mode: Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: Number(PORT)
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve static assets from dist
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[CareSync] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start CareSync server:', err);
  process.exit(1);
});
