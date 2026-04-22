import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

class SocketService {
  private socket: Socket | null = null;

  public connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL);
      
      this.socket.on("connect", () => {
        console.log("🔌 Connected to Backend Socket");
      });

      this.socket.on("disconnect", () => {
        console.log("🔌 Disconnected from Backend Socket");
      });
    }
    return this.socket;
  }

  public getSocket() {
    return this.socket || this.connect();
  }

  public emit(event: string, data: any) {
    this.getSocket().emit(event, data);
  }

  public on(event: string, callback: (data: any) => void) {
    this.getSocket().on(event, callback);
  }

  public off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export const socketService = new SocketService();
