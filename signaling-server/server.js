/**
 * ChainDrop WebRTC Signaling Server
 * Simple signaling server for P2P file transfers
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Store active rooms and connections
const rooms = new Map();
const connections = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activeRooms: rooms.size,
    activeConnections: connections.size
  });
});

// Get server stats
app.get('/stats', (req, res) => {
  res.json({
    activeRooms: rooms.size,
    activeConnections: connections.size,
    rooms: Array.from(rooms.keys()),
    uptime: process.uptime()
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  connections.set(socket.id, {
    socket,
    roomId: null,
    peerId: null,
    connectedAt: new Date()
  });

  // Handle joining a room
  socket.on('join-room', (data) => {
    try {
      const { roomId, peerId } = data;
      
      if (!roomId || !peerId) {
        socket.emit('error', { message: 'Room ID and Peer ID are required' });
        return;
      }

      // Leave previous room if any
      if (connections.get(socket.id)?.roomId) {
        leaveRoom(socket, connections.get(socket.id).roomId);
      }

      // Join new room
      socket.join(roomId);
      
      // Update connection info
      const connection = connections.get(socket.id);
      connection.roomId = roomId;
      connection.peerId = peerId;

      // Initialize room if it doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          id: roomId,
          peers: new Set(),
          createdAt: new Date(),
          lastActivity: new Date()
        });
      }

      const room = rooms.get(roomId);
      room.peers.add(peerId);
      room.lastActivity = new Date();

      console.log(`Peer ${peerId} joined room ${roomId}`);
      
      // Notify room about new peer
      socket.to(roomId).emit('peer-joined', { peerId, roomId });
      
      // Send current peers in room to the new peer
      const currentPeers = Array.from(room.peers).filter(p => p !== peerId);
      socket.emit('room-peers', { peers: currentPeers, roomId });

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room', error: error.message });
    }
  });

  // Handle leaving a room
  socket.on('leave-room', (data) => {
    try {
      const { roomId, peerId } = data;
      leaveRoom(socket, roomId, peerId);
    } catch (error) {
      console.error('Error leaving room:', error);
      socket.emit('error', { message: 'Failed to leave room', error: error.message });
    }
  });

  // Handle WebRTC signaling messages
  socket.on('signal', (data) => {
    try {
      const { to, type, data: signalData, roomId } = data;
      
      if (!to || !type || !signalData) {
        socket.emit('error', { message: 'Invalid signal data' });
        return;
      }

      // Relay signal to target peer
      socket.to(roomId).emit('signal', {
        from: connections.get(socket.id)?.peerId,
        to,
        type,
        data: signalData,
        roomId,
        timestamp: new Date().toISOString()
      });

      console.log(`Signal relayed: ${type} from ${connections.get(socket.id)?.peerId} to ${to} in room ${roomId}`);

    } catch (error) {
      console.error('Error handling signal:', error);
      socket.emit('error', { message: 'Failed to relay signal', error: error.message });
    }
  });

  // Handle heartbeat/ping
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() });
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    
    const connection = connections.get(socket.id);
    if (connection?.roomId) {
      leaveRoom(socket, connection.roomId, connection.peerId);
    }
    
    connections.delete(socket.id);
  });

  // Helper function to leave a room
  function leaveRoom(socket, roomId, peerId = null) {
    if (!roomId) return;

    socket.leave(roomId);
    
    if (peerId && rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.peers.delete(peerId);
      room.lastActivity = new Date();

      // Notify other peers
      socket.to(roomId).emit('peer-left', { peerId, roomId });

      // Clean up empty rooms
      if (room.peers.size === 0) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} cleaned up (empty)`);
      }
    }

    // Update connection info
    const connection = connections.get(socket.id);
    if (connection) {
      connection.roomId = null;
      connection.peerId = null;
    }
  }
});

// Cleanup inactive rooms every 5 minutes
setInterval(() => {
  const now = new Date();
  const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

  for (const [roomId, room] of rooms.entries()) {
    if (now - room.lastActivity > inactiveThreshold) {
      console.log(`Cleaning up inactive room: ${roomId}`);
      rooms.delete(roomId);
    }
  }
}, 5 * 60 * 1000);

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 ChainDrop Signaling Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Stats: http://localhost:${PORT}/stats`);
});

module.exports = { app, server, io };




