import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import routes from "./routes/index.js";
import { brightnessService } from "./services/BrightnessService.js";

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

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Initialize Services
brightnessService.setIo(io);

httpServer.listen(port, () => {
  console.log(`🚀 MirrorX Backend running on port ${port} (Socket.io enabled)`);
});

export default app;
