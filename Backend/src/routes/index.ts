import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";

const router = Router();

/**
 * Centrally managed route index (TypeScript Edition)
 * Stabilizing the MirrorX Enterprise Gateway.
 */
router.use("/auth", authRoutes);
router.use("/users", userRoutes);

export default router;
