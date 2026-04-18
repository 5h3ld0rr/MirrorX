import { Router, Request, Response } from "express";
import { db } from "../config/firebase.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", verifyToken as any, async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      uid: doc.id,
      name: doc.data().name || doc.data().username,
      email: doc.data().email
    }));
    res.json(users);
  } catch (error: any) {
    console.error("❌ Error fetching users:", error.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
