const express = require("express");
const http = require("http");

process.title = "networked-aframe-server";
const port = process.env.PORT || 3000;

const app = express();
const webServer = http.createServer(app);
const io = require("socket.io")(webServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = new Map();

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  let curRoom = null;

  socket.on("joinRoom", (data) => {
    const { room } = data;
    curRoom = room;
    
    let roomInfo = rooms.get(room);
    if (!roomInfo) {
      roomInfo = { name: room, occupants: {}, occupantsCount: 0 };
      rooms.set(room, roomInfo);
    }

    const joinedTime = Date.now();
    roomInfo.occupants[socket.id] = joinedTime;
    roomInfo.occupantsCount++;

    console.log(`👤 ${socket.id} joined room: ${curRoom}`);
    socket.join(curRoom);

    socket.emit("connectSuccess", { joinedTime });
    io.in(curRoom).emit("occupantsChanged", { occupants: roomInfo.occupants });
  });

  socket.on("send", (data) => {
    io.to(data.to).emit("send", data);
  });

  socket.on("broadcast", (data) => {
    socket.to(curRoom).emit("broadcast", data);
  });

  socket.on("disconnect", () => {
    console.log("👋 User disconnected:", socket.id);
    const roomInfo = rooms.get(curRoom);
    if (roomInfo) {
      delete roomInfo.occupants[socket.id];
      roomInfo.occupantsCount--;
      socket.to(curRoom).emit("occupantsChanged", { occupants: roomInfo.occupants });
      
      if (roomInfo.occupantsCount === 0) {
        rooms.delete(curRoom);
      }
    }
  });
});

webServer.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
  console.log(`📡 Socket.IO ready`);
  console.log(`🎮 Ready for Networked-AFrame connections`);
});
