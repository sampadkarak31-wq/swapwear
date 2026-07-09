require('dotenv').config();
const path = require('path');
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');
const userRoutes = require('./routes/userRoutes');
const swapRoutes = require('./routes/swapRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || '*', credentials: true },
});

connectDB();

// ---------- Security & core middleware ----------
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'", "https://cdn.socket.io"],
        styleSrc: ["'self'", "https:", "'unsafe-inline'"],
        connectSrc: ["'self'", "https:", "wss:"],
      },
    },
  })
);
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(xssClean());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// Make io accessible in controllers via req.app.get('io')
app.set('io', io);

// ---------- API routes ----------
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/swaps', swapRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'SwapWear API is running', timestamp: new Date().toISOString() });
});

// ---------- Serve frontend (single-service deployment on Render) ----------
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ---------- Error handling ----------
app.use('/api', notFound);
app.use(errorHandler);

// ---------- Socket.IO real-time chat ----------
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  socket.join(`user:${socket.userId}`);

  socket.on('joinSwap', (swapId) => {
    socket.join(`swap:${swapId}`);
  });

  socket.on('leaveSwap', (swapId) => {
    socket.leave(`swap:${swapId}`);
  });

  socket.on('typing', ({ swapId, name }) => {
    socket.to(`swap:${swapId}`).emit('typing', { swapId, name });
  });

  socket.on('stopTyping', ({ swapId }) => {
    socket.to(`swap:${swapId}`).emit('stopTyping', { swapId });
  });

  socket.on('disconnect', () => {
    // connection cleanup handled automatically by socket.io room management
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`SwapWear server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = { app, server, io };
