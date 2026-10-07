require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const initChatSocket = require('./sockets/chatSocket');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Create HTTP server
  const server = http.createServer(app);

  // Initialize Socket.io
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  initChatSocket(io);

  server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`[Unfazed Server] Running on http://localhost:${PORT}`);
    console.log(`[Environment]    ${process.env.NODE_ENV || 'development'}`);
    console.log(`[Real-time Chat] Socket.io namespace '/chat' ready`);
    console.log(`======================================================\n`);
  });
};

startServer().catch((err) => {
  console.error(`[Server Start Error] ${err.message}`);
  process.exit(1);
});
