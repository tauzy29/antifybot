require('dotenv').config();

// ==============================
// IMPORTS
// ==============================

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');

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
// CREATE EXPRESS APP
// ==============================

const app = express();

const server = http.createServer(app);

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
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io globally available
app.set('io', io);

// ==============================
// CORS
// ==============================

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

// ==============================
// BODY PARSERS
// ==============================

app.use(express.json());

app.use(express.urlencoded({
  extended: true
}));

// ==============================
// SESSION CONFIG
// ==============================

app.use(session({

  secret:
    process.env.SESSION_SECRET ||
    'antify_super_secret',

  resave: false,

  saveUninitialized: false,

  cookie: {

    secure: false, // true only on HTTPS production

    httpOnly: true,

    maxAge:
      7 * 24 * 60 * 60 * 1000
  }
}));

// ==============================
// PASSPORT
// ==============================

app.use(passport.initialize());

app.use(passport.session());

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