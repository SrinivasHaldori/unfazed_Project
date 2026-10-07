/**
 * Socket.io Real-Time Telehealth Chat Handler
 * Provides secure room-based chat between therapist and client.
 */
const initChatSocket = (io) => {
  const chatNamespace = io.of('/chat');

  chatNamespace.on('connection', (socket) => {
    console.log(`[Socket:Chat] Connected: ${socket.id}`);

    // Join a room partitioned by therapist and client IDs
    socket.on('join_room', ({ therapistId, clientId, senderRole, senderName }) => {
      if (!therapistId || !clientId) {
        socket.emit('error', { message: 'therapistId and clientId are required to join room.' });
        return;
      }

      const roomId = `room_${therapistId}_${clientId}`;
      socket.join(roomId);
      socket.data = { roomId, therapistId, clientId, senderRole, senderName };

      console.log(`[Socket:Chat] User ${senderName || socket.id} (${senderRole}) joined ${roomId}`);

      socket.to(roomId).emit('user_joined', {
        senderRole,
        senderName,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle real-time text message transmission
    socket.on('send_message', (payload) => {
      const { text, therapistId, clientId, senderRole, senderName } = payload;
      const roomId = socket.data.roomId || `room_${therapistId}_${clientId}`;

      const messageObject = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        text,
        senderRole, // 'therapist' | 'client'
        senderName,
        therapistId,
        clientId,
        timestamp: new Date().toISOString(),
      };

      // Broadcast to all participants in this private room
      chatNamespace.to(roomId).emit('receive_message', messageObject);
    });

    // Typing indicators
    socket.on('typing_start', ({ roomId, senderName }) => {
      const room = roomId || socket.data.roomId;
      if (room) {
        socket.to(room).emit('user_typing', { senderName, isTyping: true });
      }
    });

    socket.on('typing_stop', ({ roomId }) => {
      const room = roomId || socket.data.roomId;
      if (room) {
        socket.to(room).emit('user_typing', { isTyping: false });
      }
    });

    socket.on('disconnect', () => {
      if (socket.data?.roomId) {
        socket.to(socket.data.roomId).emit('user_left', {
          senderRole: socket.data.senderRole,
          senderName: socket.data.senderName,
        });
      }
      console.log(`[Socket:Chat] Disconnected: ${socket.id}`);
    });
  });
};

module.exports = initChatSocket;
