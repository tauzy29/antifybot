require('dotenv').config();

// ==============================
// IMPORTS
// ==============================

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const passport = require('passport');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const connectDB = require('./db');

// ==============================
// DEBUG ENV VARIABLES
// ==============================

console.log('=================================');
console.log('CLIENT_ID:', process.env.CLIENT_ID);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('PORT:', process.env.PORT);
console.log('=================================');

// ==============================
// LOAD PASSPORT CONFIG
// ==============================

require('./config/passport');

// ==============================
// IMPORT ROUTES
// ==============================

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

// ==============================
// CREATE EXPRESS APP & PROXIES
// ==============================

const app = express();
app.set('trust proxy', 1);

const server = http.createServer(app);

// ==============================
// CORS
// ==============================

app.use(cors({
    origin: 'https://antifybot.pages.dev',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// ==============================
// SECURITY HEADERS & LIMITERS
// ==============================

// Use helmet for secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // Disabled to avoid issues with CDN resources like Discord avatars
}));

// Apply rate limiter to all API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // limit each IP to 150 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// ==============================
// ENV VARIABLES
// ==============================

const PORT = process.env.PORT || 5000;

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  'http://localhost:5173';

// ==============================
// CONNECT DATABASE
// ==============================

connectDB();

// ==============================
// SOCKET.IO CONFIG
// ==============================

const io = socketIo(server, {
  cors: {
    origin: ['https://antifybot.pages.dev', FRONTEND_URL, 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io globally available
app.set('io', io);

// ==============================
// BODY PARSERS
// ==============================

app.use(express.json());

app.use(express.urlencoded({
  extended: true
}));

// ==============================
// JWT AUTHENTICATION MIDDLEWARE
// ==============================

const jwt = require('jsonwebtoken');
const { User } = require('./models');

app.use(async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'antify_jwt_secret');
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
      }
    }
  } catch (err) {
    console.warn('Optional JWT authentication failed:', err.message);
  }
  next();
});

// ==============================
// PASSPORT
// ==============================

app.use(passport.initialize());

// ==============================
// ROUTES
// ==============================

app.use('/api/auth', authRoutes);

app.use('/api', apiRoutes);

// ==============================
// ROOT ROUTE
// ==============================

app.get('/', (req, res) => {

  res.json({

    status: 'ANTIFY Backend Running',

    authenticated: !!req.user,

    frontend: FRONTEND_URL
  });
});

// ==============================
// HEALTH CHECK
// ==============================

app.get('/health', (req, res) => {

  res.json({

    status: 'ok',

    uptime: process.uptime(),

    authenticated: !!req.user
  });
});

// ==============================
// CURRENT USER ROUTE
// ==============================

app.get('/api/me', (req, res) => {

  if (!req.user) {

    return res.status(401).json({

      authenticated: false
    });
  }

  res.json({

    authenticated: true,

    user: req.user
  });
});

// ==============================
// SOCKET CONNECTIONS
// ==============================

io.on('connection', (socket) => {

  console.log(
    `🔌 Client connected: ${socket.id}`
  );

  // ==========================
  // JOIN GUILD ROOM
  // ==========================

  socket.on('join_guild', (guildId) => {

    const roomName =
      `guild_${guildId}`;

    socket.join(roomName);

    console.log(
      `📡 Joined room: ${roomName}`
    );
  });

  // ==========================
  // LEAVE GUILD ROOM
  // ==========================

  socket.on('leave_guild', (guildId) => {

    const roomName =
      `guild_${guildId}`;

    socket.leave(roomName);

    console.log(
      `📡 Left room: ${roomName}`
    );
  });

  // ==========================
  // DISCONNECT
  // ==========================

  socket.on('disconnect', () => {

    console.log(
      `❌ Client disconnected: ${socket.id}`
    );
  });
});

// ==============================
// START SERVER FUNCTION
// ==============================

function startServer(client) {
  if (client) {
    app.set('discordClient', client);
    client.io = io;
  }

  server.listen(PORT, () => {
    console.log(`
========================================
🚀 ANTIFY Backend Running
🌐 Port: ${PORT}
🖥️ Frontend: ${FRONTEND_URL}
========================================
`);
  });
}

// Support both direct execution and bot.js module import
if (require.main === module) {
  console.warn('⚠️ Warning: backend/server.js run directly. Redirecting to start bot.js...');
  require('../bot.js');
}

module.exports = startServer;