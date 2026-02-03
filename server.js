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

// Serve static files if you have any (optional)
app.use(express.static("public"));

// Create HTTP server
const webServer = http.createServer(app);

// Attach Socket.IO
const io = socketIO(webServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Start EasyRTC server
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
const rtc = easyrtc.listen(app, io, null, (err, rtcRef) => {
  if (err) {
    console.error("EasyRTC initialization error:", err);
    return;
  }
  
  console.log("✅ EasyRTC server initialized");
  
  rtcRef.events.on("roomCreate", (appObj, creatorConnectionObj, roomName, roomOptions, callback) => {
    console.log("Room created:", roomName);
    callback(null);
  });

  rtcRef.events.on("roomJoin", (connectionObj, roomName, roomParameter, callback) => {
    console.log(`Client ${connectionObj.getEasyrtcid()} joined room: ${roomName}`);
    callback(null);
  });
});

// Start server
webServer.listen(port, () => {
  console.log(`🚀 EasyRTC server listening on port ${port}`);
  console.log(`📡 Socket.IO ready`);
  console.log(`🎮 Server ready for Networked-AFrame connections`);
});
