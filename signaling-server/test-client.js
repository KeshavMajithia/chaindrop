/**
 * Simple test client for ChainDrop Signaling Server
 * Tests basic functionality without WebRTC
 */

const io = require('socket.io-client');

const SERVER_URL = 'http://localhost:3001';

console.log('🧪 Testing ChainDrop Signaling Server...\n');

// Create two test clients to simulate peer-to-peer communication
const client1 = io(SERVER_URL);
const client2 = io(SERVER_URL);

const roomId = 'test-room-' + Date.now();
const peer1Id = 'peer-1';
const peer2Id = 'peer-2';

// Test 1: Health Check
console.log('1️⃣ Testing health endpoint...');
fetch('http://localhost:3001/health')
  .then(response => response.json())
  .then(data => {
    console.log('✅ Health check passed:', data.status);
  })
  .catch(error => {
    console.log('❌ Health check failed:', error.message);
  });

// Test 2: Room joining
console.log('\n2️⃣ Testing room joining...');

client1.on('connect', () => {
  console.log('✅ Client 1 connected');
  
  client1.emit('join-room', { roomId, peerId: peer1Id });
});

client2.on('connect', () => {
  console.log('✅ Client 2 connected');
  
  client2.emit('join-room', { roomId, peerId: peer2Id });
});

// Test 3: Peer discovery
client1.on('peer-joined', (data) => {
  console.log('✅ Client 1 detected peer:', data.peerId);
});

client2.on('peer-joined', (data) => {
  console.log('✅ Client 2 detected peer:', data.peerId);
});

// Test 4: Signaling
client1.on('room-peers', (data) => {
  console.log('✅ Client 1 received peer list:', data.peers);
  
  // Send a test signal
  setTimeout(() => {
    console.log('\n3️⃣ Testing signaling...');
    client1.emit('signal', {
      to: peer2Id,
      type: 'test-message',
      data: { message: 'Hello from peer 1!' },
      roomId
    });
  }, 1000);
});

client2.on('signal', (data) => {
  console.log('✅ Client 2 received signal:', data.type, data.data);
  
  // Send response
  setTimeout(() => {
    client2.emit('signal', {
      to: peer1Id,
      type: 'test-response',
      data: { message: 'Hello back from peer 2!' },
      roomId
    });
  }, 500);
});

client1.on('signal', (data) => {
  if (data.type === 'test-response') {
    console.log('✅ Client 1 received response:', data.data);
  }
});

// Test 5: Cleanup
setTimeout(() => {
  console.log('\n4️⃣ Testing cleanup...');
  client1.emit('leave-room', { roomId, peerId: peer1Id });
  client2.emit('leave-room', { roomId, peerId: peer2Id });
  
  setTimeout(() => {
    console.log('✅ Test completed successfully!');
    client1.disconnect();
    client2.disconnect();
    process.exit(0);
  }, 1000);
}, 3000);

// Error handling
client1.on('error', (error) => {
  console.log('❌ Client 1 error:', error);
});

client2.on('error', (error) => {
  console.log('❌ Client 2 error:', error);
});

// Timeout for test
setTimeout(() => {
  console.log('⏰ Test timeout - something went wrong');
  process.exit(1);
}, 10000);






