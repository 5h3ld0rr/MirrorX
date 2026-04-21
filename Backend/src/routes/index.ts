import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import alarmRoutes from "./alarms.routes.js";
import noteRoutes from "./notes.routes.js";
import spotifyRoutes from "./spotify.routes.js";

const router = Router();

/**
 * Centrally managed route index (TypeScript Edition)
 * Stabilizing the MirrorX Enterprise Gateway.
 */
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/alarms", alarmRoutes);
router.use("/notes", noteRoutes);

export default router;
