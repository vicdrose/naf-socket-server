const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const easyrtc = require("open-easyrtc");

// Set process name
process.title = "naf-easyrtc-server";

// Get port or default to 3000
const port = process.env.PORT || 3000;

// Setup Express
const app = express();

// CORS middleware - CRITICAL for cross-origin requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Serve static files if you have any (optional)
app.use(express.static("public"));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create HTTP server
const webServer = http.createServer(app);

// Attach Socket.IO with CORS
const io = socketIO(webServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false
  },
  transports: ['websocket', 'polling']
});

// Configure EasyRTC
easyrtc.setOption("appIceServers", [
  {
    urls: "stun:stun.l.google.com:19302"
  },
  {
    urls: "stun:stun1.l.google.com:19302"
  }
]);

easyrtc.setOption("logLevel", "debug");
easyrtc.setOption("demosEnable", false);

// Start EasyRTC
console.log("🔄 Starting EasyRTC server...");

try {
  const rtc = easyrtc.listen(app, io, null, (err, rtcRef) => {
    if (err) {
      console.error("❌ EasyRTC initialization error:", err);
      process.exit(1);
    }
    
    console.log("✅ EasyRTC server initialized");
    
    rtcRef.events.on("roomCreate", (appObj, creatorConnectionObj, roomName, roomOptions, callback) => {
      console.log("🏠 Room created:", roomName);
      callback(null);
    });

    rtcRef.events.on("roomJoin", (connectionObj, roomName, roomParameter, callback) => {
      console.log(`👤 Client ${connectionObj.getEasyrtcid()} joined room: ${roomName}`);
      callback(null);
    });
    
    rtcRef.events.on("disconnect", (connectionObj, next) => {
      console.log(`👋 Client ${connectionObj.getEasyrtcid()} disconnected`);
      next();
    });
  });
} catch (error) {
  console.error("💥 Fatal error starting EasyRTC:", error);
  process.exit(1);
}

// Start server
webServer.listen(port, () => {
  console.log(`🚀 EasyRTC server listening on port ${port}`);
  console.log(`📡 Socket.IO ready with CORS enabled`);
  console.log(`🎮 Server ready for Networked-AFrame connections`);
  console.log(`🌐 Access at: http://localhost:${port}`);
});

// Error handlers
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});
