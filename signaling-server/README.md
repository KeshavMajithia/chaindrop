# ChainDrop Signaling Server

A simple WebRTC signaling server for ChainDrop P2P file transfers. This server facilitates peer-to-peer connections by relaying WebRTC signaling messages between clients.

## Features

- **Room-based signaling**: Create unique rooms for file transfers
- **WebRTC message relay**: Handles offers, answers, and ICE candidates
- **CORS enabled**: Cross-origin requests supported
- **Health monitoring**: Built-in health check and stats endpoints
- **Auto cleanup**: Removes inactive rooms automatically
- **Error handling**: Comprehensive error management

## Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Navigate to the signaling server directory:
```bash
cd signaling-server
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

The server will start on port 3001 by default.

## API Endpoints

### Health Check
```
GET /health
```
Returns server health status and basic stats.

### Server Stats
```
GET /stats
```
Returns detailed server statistics including active rooms and connections.

## Socket.IO Events

### Client → Server Events

#### `join-room`
Join a room for peer discovery.
```javascript
socket.emit('join-room', {
  roomId: 'unique-room-id',
  peerId: 'unique-peer-id'
});
```

#### `leave-room`
Leave the current room.
```javascript
socket.emit('leave-room', {
  roomId: 'unique-room-id',
  peerId: 'unique-peer-id'
});
```

#### `signal`
Send WebRTC signaling messages (offers, answers, ICE candidates).
```javascript
socket.emit('signal', {
  to: 'target-peer-id',
  type: 'offer', // or 'answer', 'ice-candidate'
  data: signalData,
  roomId: 'room-id'
});
```

#### `ping`
Send heartbeat to keep connection alive.
```javascript
socket.emit('ping');
```

### Server → Client Events

#### `peer-joined`
Notified when a new peer joins the room.
```javascript
socket.on('peer-joined', (data) => {
  console.log('New peer:', data.peerId);
});
```

#### `peer-left`
Notified when a peer leaves the room.
```javascript
socket.on('peer-left', (data) => {
  console.log('Peer left:', data.peerId);
});
```

#### `room-peers`
Receive list of current peers in the room.
```javascript
socket.on('room-peers', (data) => {
  console.log('Current peers:', data.peers);
});
```

#### `signal`
Receive WebRTC signaling messages from other peers.
```javascript
socket.on('signal', (data) => {
  // Handle offer, answer, or ICE candidate
  console.log('Signal from:', data.from, 'type:', data.type);
});
```

#### `pong`
Heartbeat response.
```javascript
socket.on('pong', (data) => {
  console.log('Server responded at:', data.timestamp);
});
```

#### `error`
Error messages from the server.
```javascript
socket.on('error', (data) => {
  console.error('Server error:', data.message);
});
```

## Usage Example

### Basic Client Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

// Join a room
socket.emit('join-room', {
  roomId: 'transfer-123',
  peerId: 'sender-456'
});

// Listen for other peers
socket.on('peer-joined', (data) => {
  console.log('New peer joined:', data.peerId);
  // Start WebRTC connection
});

// Send WebRTC offer
socket.emit('signal', {
  to: 'receiver-789',
  type: 'offer',
  data: offerData,
  roomId: 'transfer-123'
});

// Listen for WebRTC signals
socket.on('signal', (data) => {
  if (data.type === 'offer') {
    // Handle offer
  } else if (data.type === 'answer') {
    // Handle answer
  } else if (data.type === 'ice-candidate') {
    // Handle ICE candidate
  }
});
```

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3001)

### Room Management

- Rooms are automatically created when the first peer joins
- Rooms are automatically cleaned up when empty
- Inactive rooms are cleaned up after 5 minutes of inactivity

### Connection Management

- Each connection is tracked with metadata
- Automatic cleanup on disconnection
- Heartbeat support for connection health

## Development

### Project Structure

```
signaling-server/
├── package.json          # Dependencies and scripts
├── server.js             # Main server implementation
└── README.md             # This file
```

### Scripts

- `npm start`: Start the server
- `npm run dev`: Start with nodemon for development
- `npm test`: Run tests (placeholder)

## Error Handling

The server includes comprehensive error handling:

- Invalid room/peer IDs
- Missing required data
- Connection errors
- Automatic cleanup of failed connections

## Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

### Server Stats
```bash
curl http://localhost:3001/stats
```

## Security Notes

⚠️ **This is a development server with minimal security:**

- No authentication
- No rate limiting
- CORS enabled for all origins
- No data persistence

For production use, consider adding:
- Authentication/authorization
- Rate limiting
- Input validation
- HTTPS/TLS
- Logging and monitoring

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the PORT environment variable
2. **CORS errors**: Ensure the server URL is correct in your client
3. **Connection timeouts**: Check network connectivity and firewall settings

### Logs

The server logs important events:
- Client connections/disconnections
- Room joins/leaves
- Signal message relay
- Error conditions

## License

MIT License - see package.json for details.






