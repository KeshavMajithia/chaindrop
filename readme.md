# 🌊 ChainDrop

**A Hybrid Decentralized File Transfer Platform**

ChainDrop combines WebRTC P2P transfers with blockchain-powered permanent storage, offering both instant free transfers and premium decentralized file sharing.

---

## 🎯 What We've Built

### ✅ Implemented Features

#### **1. WebRTC P2P File Transfer (Free Tier)**
- **Real-time peer-to-peer file transfers** - No server intermediary
- **End-to-end encryption** (AES-256-GCM) - Files encrypted before transmission
- **Chunked transfer system** - 16KB chunks with progress tracking
- **Socket.IO signaling** - Peer discovery and WebRTC connection establishment
- **Multi-gateway support** - Automatic fallback for reliability
- **QR code sharing** - Easy mobile-to-desktop transfers
- **Real-time progress tracking** - Live transfer speed and completion percentage

#### **2. IPFS Decentralized Storage (Premium Tier)**
- **Pinata IPFS integration** - Permanent decentralized file storage
- **Client-side encryption** - Files encrypted before upload (AES-256-GCM)
- **Metadata on IPFS** - File info stored separately for retrieval
- **Cross-device transfers** - Files accessible from any browser/device
- **Public gateway downloads** - No API keys needed to download
- **localStorage backup** - Same-browser fallback for reliability

#### **3. Sui Blockchain Integration (Mock)**
- **Mock wallet connection** - Sui wallet integration (Slush wallet)
- **Mock smart contracts** - Drop creation and management
- **Network switching** - Testnet/Devnet support
- **Balance display** - SUI token balance tracking

#### **4. Beautiful Modern UI**
- **Glass morphism design** - Modern, sleek interface
- **Responsive layout** - Works on mobile and desktop
- **Dark theme** - Easy on the eyes
- **Real-time status updates** - Live connection and transfer states
- **File type icons** - Visual file type identification

---

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first styling
- **Radix UI** - Headless UI components
- **Lucide Icons** - Modern icon library
- **QRCode.react** - QR code generation

### **Real-time Communication**
- **simple-peer** - WebRTC wrapper library
- **Socket.IO** - Real-time bidirectional communication
- **Express** - Signaling server backend

### **Decentralized Storage**
- **Pinata** - IPFS pinning service
- **IPFS** - InterPlanetary File System
- **Multiple IPFS Gateways**:
  - Pinata Gateway
  - IPFS.io
  - Cloudflare IPFS
  - dweb.link
  - w3s.link

### **Blockchain**
- **Sui SDK** (@mysten/sui.js) - Sui blockchain interaction
- **Sui Wallet Adapter** - Wallet connection
- **Mock Walrus** - Decentralized blob storage (mocked)

### **Encryption**
- **Web Crypto API** - Browser-native cryptography
- **AES-256-GCM** - Authenticated encryption
- **Random IV generation** - Unique initialization vectors

---

## 🏗️ Architecture

### **File Transfer Flow**

```
┌─────────────────────────────────────────────────────────────┐
│                    CHAINDROP ARCHITECTURE                    │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   SENDER     │         │  SIGNALING   │         │   RECEIVER   │
│   Browser    │◄───────►│   SERVER     │◄───────►│   Browser    │
└──────────────┘         │ (Socket.IO)  │         └──────────────┘
       │                 └──────────────┘                │
       │                                                 │
       │          WebRTC Direct Connection               │
       │◄────────────────────────────────────────────────►│
       │                                                 │
       ▼                                                 ▼
┌──────────────┐                                  ┌──────────────┐
│  Encrypt     │                                  │  Decrypt     │
│  (AES-256)   │                                  │  (AES-256)   │
└──────────────┘                                  └──────────────┘
       │                                                 │
       ▼                                                 ▼
  Send Chunks ──────────────────────────────────────►   Receive Chunks
   (16KB each)                                      (Reassemble)
```

### **Premium Storage Flow (IPFS)**

```
┌──────────────────────────────────────────────────────────────┐
│              IPFS DECENTRALIZED STORAGE FLOW                  │
└──────────────────────────────────────────────────────────────┘

     SENDER                                          RECEIVER
       │                                                │
       ▼                                                │
┌─────────────┐                                        │
│ Select File │                                        │
└─────────────┘                                        │
       │                                                │
       ▼                                                │
┌─────────────┐                                        │
│   Encrypt   │ AES-256-GCM                            │
│  (Client)   │                                        │
└─────────────┘                                        │
       │                                                │
       ▼                                                │
┌─────────────┐                                        │
│ Upload to   │──┐                                     │
│   Pinata    │  │                                     │
└─────────────┘  │                                     │
       │         │                                     │
       ▼         │                                     │
  Get File CID  │                                     │
       │         │                                     │
       ▼         │                                     │
┌─────────────┐  │                                     │
│  Upload     │  │                                     │
│  Metadata   │  │                                     │
│  to Pinata  │  │                                     │
└─────────────┘  │                                     │
       │         │                                     │
       ▼         │                                     │
 Get Metadata CID│                                     │
       │         │                                     │
       ▼         ▼                                     │
┌─────────────────┐                                   │
│  IPFS Network   │                                   │
│  (Permanent)    │                                   │
└─────────────────┘                                   │
       │                                               │
       │                                               │
       ▼                                               │
  Generate Link ────────────────────────────────────────┤
  (with Metadata CID)                                 │
                                                       ▼
                                              ┌─────────────┐
                                              │ Open Link   │
                                              └─────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────┐
                                              │ Download    │
                                              │ Metadata    │
                                              │ from IPFS   │
                                              └─────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────┐
                                              │ Download    │
                                              │ File from   │
                                              │ IPFS        │
                                              └─────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────┐
                                              │  Decrypt    │
                                              │  (Client)   │
                                              └─────────────┘
                                                       │
                                                       ▼
                                                 Save File
```

---

## 🔐 Security Features

### **End-to-End Encryption**
- **AES-256-GCM** (Galois/Counter Mode)
- **256-bit keys** generated with `crypto.getRandomValues()`
- **Unique IV** (Initialization Vector) for each file
- **Client-side only** - Keys never sent to server
- **URL hash transmission** - Keys in URL fragment (#) not sent to server

### **Data Privacy**
- Files encrypted **before** upload to IPFS
- Files encrypted **before** WebRTC transfer
- Server **cannot** decrypt files
- IPFS network stores **encrypted blobs only**

---

## 🚀 How It Works

### **WebRTC P2P Transfer (Free)**

1. **Sender uploads file**
   - File encrypted client-side (AES-256-GCM)
   - Generates unique transfer ID
   - Joins signaling room

2. **Receiver opens link**
   - Extracts transfer ID from URL
   - Joins same signaling room
   - Extracts encryption key from URL hash

3. **WebRTC connection**
   - Socket.IO facilitates peer discovery
   - Offer/Answer exchange via signaling
   - Direct peer-to-peer connection established

4. **File transfer**
   - File sent in 16KB chunks
   - Real-time progress tracking
   - Chunks decrypted and reassembled
   - Automatic download triggered

### **IPFS Premium Transfer**

1. **Sender uploads file**
   - File encrypted client-side (AES-256-GCM)
   - Encrypted file uploaded to IPFS via Pinata → **File CID**
   - Metadata JSON uploaded to IPFS → **Metadata CID**
   - Link generated: `/drop/{dropId}?meta={metadataCID}`

2. **Receiver opens link**
   - Extracts drop ID and metadata CID from URL
   - Downloads metadata JSON from IPFS (any public gateway)
   - Extracts file CID and encryption key from metadata

3. **File download**
   - Downloads encrypted file from IPFS using file CID
   - Tries multiple gateways for reliability
   - Falls back to localStorage if IPFS unavailable

4. **Decryption & download**
   - File decrypted client-side using key from metadata
   - Automatic browser download triggered

---

## 📦 Setup & Installation

### **Prerequisites**
- Node.js 18+
- npm or yarn
- Pinata account (for IPFS uploads)

### **Environment Variables**

Create `.env.local` in the project root:

```bash
# Pinata IPFS Configuration
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token_here
```

**Getting Pinata API Key:**
1. Go to https://pinata.cloud
2. Create free account
3. API Keys → Create New Key
4. Permissions: `Files` → `Write`
5. Copy JWT token to `.env.local`

### **Installation**

```bash
# Install dependencies
npm install

# Start signaling server (Socket.IO)
node server.js

# Start Next.js dev server (in another terminal)
npm run dev
```

### **Usage**

1. **Free Transfer (WebRTC)**
   - Click "Free Transfer"
   - Select file
   - Share link with recipient
   - Both users must be online simultaneously

2. **Premium Transfer (IPFS)**
   - Connect Sui wallet
   - Click "Premium Transfer"
   - Select file
   - File uploaded to IPFS (permanent)
   - Share link - works anytime, any device

---

## 🎨 Key Technical Achievements

### **1. WebRTC Implementation**
- ✅ Peer-to-peer direct connections
- ✅ NAT traversal with STUN servers
- ✅ Chunked file transfer (handles large files)
- ✅ Real-time progress tracking
- ✅ Checksum validation (file integrity)

### **2. IPFS Integration**
- ✅ Pinata API integration with JWT auth
- ✅ Multi-gateway fallback system
- ✅ Metadata separation (file + metadata CIDs)
- ✅ Client-side encryption before upload
- ✅ Public gateway downloads (no auth needed)

### **3. Encryption System**
- ✅ Web Crypto API (native browser crypto)
- ✅ AES-256-GCM authenticated encryption
- ✅ Unique IV per file
- ✅ Key generation and management
- ✅ Zero server-side decryption

### **4. State Management**
- ✅ React Context API for global state
- ✅ Real-time WebRTC connection states
- ✅ Transfer progress tracking
- ✅ Error handling and retry logic

### **5. Developer Experience**
- ✅ TypeScript for type safety
- ✅ Modular architecture
- ✅ Comprehensive console logging
- ✅ Error boundaries and fallbacks

---

## 📁 Project Structure

```
chaindrop/
├── app/
│   ├── app/
│   │   └── page.tsx              # Main upload page
│   ├── receive/[transferId]/
│   │   └── page.tsx              # WebRTC receiver page
│   ├── drop/[dropId]/
│   │   └── page.tsx              # IPFS download page
│   └── layout.tsx                # Root layout
├── components/
│   ├── wallet-button.tsx         # Sui wallet connection
│   └── ui/                       # Radix UI components
├── lib/
│   ├── encryption/
│   │   └── client-encryption.ts  # AES-256-GCM encryption
│   ├── storage/
│   │   ├── real-walrus.ts        # IPFS/Pinata integration
│   │   ├── real-decentralized-storage.ts  # IPFS orchestration
│   │   └── local-drop-storage.ts # localStorage backup
│   ├── webrtc/
│   │   ├── file-transfer.ts      # WebRTC transfer logic
│   │   ├── peer-connection.ts    # WebRTC peer management
│   │   └── signaling.ts          # Socket.IO signaling
│   └── sui/
│       ├── contract.ts           # Mock Sui contracts
│       └── wallet-provider.tsx   # Wallet context
├── server.js                     # Socket.IO signaling server
├── .env.local                    # Environment variables
└── package.json
```

---

## 🔮 Future Enhancements

### **Phase 3: Advanced Features**
- [ ] Time-locked transfers (files expire)
- [ ] NFT-gated access (only NFT holders can download)
- [ ] Escrow payments (pay to download)
- [ ] Multi-file transfers
- [ ] Folder compression and upload
- [ ] Transfer history dashboard

### **Phase 4: Production Ready**
- [ ] Real Sui smart contracts (replace mocks)
- [ ] Real Walrus integration (replace mock)
- [ ] Analytics and metrics
- [ ] Mobile apps (React Native)
- [ ] Browser extensions
- [ ] Desktop apps (Electron)

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

---

## 🙏 Acknowledgments

- **Pinata** - IPFS pinning service
- **Sui Network** - Blockchain infrastructure
- **WebRTC** - Peer-to-peer technology
- **Next.js Team** - Amazing React framework

---

## 💬 Support

For issues or questions:
- Open an issue on GitHub
- Check console logs for debugging
- Refer to this README for setup help

---

**Built with ❤️ for decentralized file sharing**

🌊 **ChainDrop** - Where Web3 meets file transfer