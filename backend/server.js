import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import connectDb from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import trackingRoutes from './routes/trackingRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import { setIo } from './controllers/driverController.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || '*', credentials: true },
  transports: ['websocket', 'polling'],
});

// Inject io into driver controller for broadcasts
setIo(io);

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*', credentials: true }));
app.use(express.json());

// Static uploads
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/schedules', scheduleRoutes);

app.use(notFound);
app.use(errorHandler);

// Socket.IO — real-time tracking & notifications
io.on('connection', socket => {
  console.log(`Socket connected: ${socket.id}`);

  // Citizen joins a vehicle room to receive location updates
  socket.on('tracking:join', vehicleId => {
    socket.join(`vehicle:${vehicleId}`);
    console.log(`Socket ${socket.id} joined vehicle:${vehicleId}`);
  });

  // Driver manually sends update (fallback if REST not used)
  socket.on('tracking:update', update => {
    io.to(`vehicle:${update.vehicleId}`).emit('tracking:updated', update);
  });

  // Driver joins their own room for commands/notifications
  socket.on('driver:join', driverId => {
    socket.join(`driver:${driverId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

connectDb().then(() => {
  server.listen(process.env.PORT || 5000, () => {
    console.log(`CleanConnectPlus API running on port ${process.env.PORT || 5000}`);
  });
});
