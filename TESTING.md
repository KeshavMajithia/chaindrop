# ChainDrop Testing Guide

## Fixed Issues ✅

1. **Next.js 15 Dynamic Route Error** - Fixed `params` usage with `use()` hook
2. **SignalingManager Implementation** - Fully implemented Socket.IO signaling

## How to Test File Transfer

### Step 1: Start the Signaling Server
```bash
cd signaling-server
node server.js
```
You should see:
```
🚀 ChainDrop Signaling Server running on port 3001
📊 Health check: http://localhost:3001/health
📈 Stats: http://localhost:3001/stats
```

### Step 2: Start the Next.js Dev Server
In a new terminal:
```bash
npm run dev
```

### Step 3: Test File Transfer

1. **Sender (Browser 1)**:
   - Open `http://localhost:3000/app`
   - Upload a file
   - Click "Initiate Transfer"
   - Wait for the transfer link to be generated
   - Copy the link

2. **Receiver (Browser 2 or Incognito)**:
   - Open the transfer link (e.g., `http://localhost:3000/receive/transfer_xxx`)
   - The file should start transferring automatically
   - Download will start when complete

### Expected Console Output

**Signaling Server:**
```
Client connected: <socket-id-1>
Peer sender_<timestamp> joined room room_transfer_<transferId>
Client connected: <socket-id-2>
Peer receiver_<timestamp> joined room room_transfer_<transferId>
Signal relayed: offer from sender_xxx to receiver_xxx in room room_transfer_xxx
Signal relayed: answer from receiver_xxx to sender_xxx in room room_transfer_xxx
```

**IMPORTANT**: Both sender and receiver MUST join the SAME room: `room_transfer_<transferId>`

**Browser Console (Sender):**
```
Peer connected: <receiver-id>
Transfer started: <file-id>
Transfer progress: 25%
Transfer progress: 50%
Transfer progress: 75%
Transfer completed: <file-id>
```

**Browser Console (Receiver):**
```
Connected to sender: <sender-id>
Transfer started: <file-id>
Transfer progress: 25%
Transfer progress: 50%
Transfer progress: 75%
File received: <file-id>
```

## Troubleshooting

### Issue: "Not connected to signaling server"
- **Solution**: Make sure the signaling server is running on port 3001
- Check: `http://localhost:3001/health`

### Issue: "Waiting for receiver..."
- **Solution**: Open the transfer link in another browser/tab
- Make sure both sender and receiver are connected to the same signaling server

### Issue: Connection timeout
- **Solution**: Check if port 3001 is blocked by firewall
- Try restarting both servers

### Issue: File not downloading
- **Solution**: Check browser console for errors
- Verify WebRTC is supported in your browser
- Try using Chrome or Edge (best WebRTC support)

## Environment Variables

Create `.env.local` if you want to customize:
```env
NEXT_PUBLIC_SIGNALING_SERVER_URL=http://localhost:3001
```

## Production Deployment Notes

For production, you'll need to:
1. Deploy signaling server to a cloud provider (Heroku, Railway, etc.)
2. Update `NEXT_PUBLIC_SIGNALING_SERVER_URL` to your signaling server URL
3. Use HTTPS for both frontend and signaling server
4. Consider using TURN servers for better NAT traversal
