import { Request, Response, NextFunction } from "express";
import { auth } from "../config/firebase.js";

/**
 * Middleware to verify Firebase ID Token (TypeScript Edition)
 * Attaches decoded user data to req.user for full-stack biometric safety.
 */
export const verifyToken = async (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided. Authorization denied." });
  }

  const idToken = authHeader.split(" ")[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error: any) {
    console.error("❌ Token Verification Error:", error.message);
    res.status(401).json({ error: "Invalid or expired token." });
  }
};
