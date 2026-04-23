import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import routes from "./routes/index.js";
import { brightnessService } from "./services/BrightnessService.js";
import { motionService } from "./services/MotionService.js";
import { cameraFaceService } from "./services/CameraFaceService.js";
import { browserService } from "./services/BrowserService.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", routes);

// Socket.io
io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on("brightness:toggle", (enabled: boolean) => {
    brightnessService.setAutoBrightness(enabled);
  });

  socket.on("face:toggle", (enabled: boolean) => {
    if (enabled) cameraFaceService.startService();
    else cameraFaceService.stopService();
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Initialize Services
brightnessService.setIo(io);
motionService.setIo(io);
cameraFaceService.setIo(io);
cameraFaceService.startService();

httpServer.listen(port, () => {
  console.log(`🚀 MirrorX Backend running on port ${port} (Socket.io/Hardware enabled)`);
  
  // Automatically open the mirror interface
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
  setTimeout(() => {
    browserService.openUrl(frontendUrl);
  }, 3000);
});

export default app;
