# WebRTC Connection Flow - ChainDrop

## Fixed Connection Sequence

### Step 1: Sender Uploads File
```
Sender (Browser 1)
  ├─ Upload file
  ├─ Generate transferId: "transfer_1761048158927_xxx"
  ├─ Generate roomId: "room_transfer_1761048158927_xxx"
  ├─ Connect to signaling server
  └─ Join room: "room_transfer_1761048158927_xxx" as "sender_1761048158928"
```

### Step 2: Receiver Opens Link
```
Receiver (Browser 2)
  ├─ Open link: /receive/transfer_1761048158927_xxx
  ├─ Extract transferId from URL
  ├─ Generate roomId: "room_transfer_1761048158927_xxx" (SAME as sender!)
  ├─ Connect to signaling server
  └─ Join room: "room_transfer_1761048158927_xxx" as "receiver_1761048169955"
```

### Step 3: Signaling Server Notifies Sender
```
Signaling Server
  └─ Emit "peer-joined" event to sender
     └─ Data: { peerId: "receiver_1761048169955" }
```

### Step 4: Sender Creates WebRTC Peer Connection
```
Sender
  ├─ Receive "peer-joined" event
  ├─ Create SimplePeer instance for "receiver_1761048169955" (initiator: true)
  ├─ SimplePeer generates SDP offer
  └─ Send offer via signaling server
     └─ Message: { type: 'offer', from: 'sender_xxx', to: 'receiver_xxx', data: <SDP> }
```

### Step 5: Receiver Processes Offer
```
Receiver
  ├─ Receive "signal" event with offer
  ├─ Create SimplePeer instance for "sender_xxx" (initiator: false)
  ├─ Process SDP offer
  ├─ SimplePeer generates SDP answer
  └─ Send answer via signaling server
     └─ Message: { type: 'answer', from: 'receiver_xxx', to: 'sender_xxx', data: <SDP> }
```

### Step 6: Sender Processes Answer
```
Sender
  ├─ Receive "signal" event with answer
  ├─ Process SDP answer
  └─ WebRTC connection established! 🎉
```

### Step 7: ICE Candidate Exchange (Automatic)
```
Both Peers
  ├─ Exchange ICE candidates via signaling server
  ├─ Find best connection path (STUN/TURN)
  └─ Direct P2P data channel opens
```

### Step 8: File Transfer
```
Sender
  ├─ Wait for "peerConnected" event
  ├─ Call transferManager.sendFile(file, peerId)
  ├─ Split file into 16KB chunks
  ├─ Emit "metadataToSend" event
  ├─ Send file metadata via data channel { type: 'file-metadata', data: metadata }
  ├─ Emit "chunkToSend" events
  ├─ Send chunks via data channel { type: 'file-chunk', data: chunk }
  └─ Track progress

Receiver
  ├─ Receive file metadata { type: 'file-metadata' }
  ├─ Call transferManager.receiveFile(metadata, peerId)
  ├─ Initialize transfer session
  ├─ Receive chunks { type: 'file-chunk' }
  ├─ Call transferManager.processChunk(chunk, peerId)
  ├─ Reassemble file
  ├─ Verify checksum
  └─ Trigger browser download
```

## Key Points

1. **Same Room**: Both peers MUST join the same room: `room_${transferId}`
2. **Initiator**: Sender creates peer with `initiator: true`, receiver with `initiator: false`
3. **Peer ID**: Sender creates peer connection using receiver's peer ID, not its own
4. **Signaling**: All WebRTC signals (offer, answer, ICE) go through Socket.IO signaling server
5. **Data Channel**: Once connected, file data flows directly P2P (not through server)

## Console Output (Expected)

### Sender Console:
```
Receiver joined: receiver_1761048169955
Sending offer to receiver: receiver_1761048169955
Received answer from receiver: receiver_1761048169955
Peer connected, starting file transfer
Transfer started: <file-id>
Transfer progress: 25%
Transfer progress: 50%
Transfer progress: 75%
Transfer completed: <file-id>
```

### Receiver Console:
```
Received offer from sender: sender_1761048158928
Sending answer to sender: sender_1761048158928
Connected to sender: sender_1761048158928
Transfer started: <file-id>
Transfer progress: 25%
Transfer progress: 50%
Transfer progress: 75%
File received: <file-id>
```

### Signaling Server Console:
```
Client connected: <socket-1>
Peer sender_1761048158928 joined room room_transfer_1761048158927_xxx
Client connected: <socket-2>
Peer receiver_1761048169955 joined room room_transfer_1761048158927_xxx
Signal relayed: offer from sender_xxx to receiver_xxx in room room_transfer_xxx
Signal relayed: answer from receiver_xxx to sender_xxx in room room_transfer_xxx
Signal relayed: ice-candidate from sender_xxx to receiver_xxx
Signal relayed: ice-candidate from receiver_xxx to sender_xxx
```
