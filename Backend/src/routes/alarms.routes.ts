import { Router, Request, Response } from "express";
import { db } from "../config/firebase.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

// Get all alarms for a user
router.get("/", verifyToken as any, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const snapshot = await db.collection("users").doc(uid).collection("alarms").get();
    
    const alarms = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(alarms);
  } catch (error: any) {
    console.error("❌ Error fetching alarms:", error.message);
    res.status(500).json({ error: "Failed to fetch alarms" });
  }
});

// Create a new alarm
router.post("/", verifyToken as any, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const { time, label, active, days } = req.body;

    if (!time) {
      return res.status(400).json({ error: "Time is required" });
    }

    const newAlarm = {
      time,
      label: label || "Alarm",
      active: active ?? true,
      days: days || [],
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection("users").doc(uid).collection("alarms").add(newAlarm);
    
    res.json({ id: docRef.id, ...newAlarm });
  } catch (error: any) {
    console.error("❌ Error creating alarm:", error.message);
    res.status(500).json({ error: "Failed to create alarm" });
  }
});

// Update an alarm
router.patch("/:id", verifyToken as any, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const { id } = req.params;
    const { time, label, active, days } = req.body;

    const updateData: any = {};
    if (time !== undefined) updateData.time = time;
    if (label !== undefined) updateData.label = label;
    if (active !== undefined) updateData.active = active;
    if (days !== undefined) updateData.days = days;

    await db.collection("users").doc(uid as string).collection("alarms").doc(id as string).update(updateData);
    
    res.json({ id, ...updateData });
  } catch (error: any) {
    console.error("❌ Error updating alarm:", error.message);
    res.status(500).json({ error: "Failed to update alarm" });
  }
});

// Delete an alarm
router.delete("/:id", verifyToken as any, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const { id } = req.params;

    await db.collection("users").doc(uid as string).collection("alarms").doc(id as string).delete();
    
    res.json({ message: "Alarm deleted successfully" });
  } catch (error: any) {
    console.error("❌ Error deleting alarm:", error.message);
    res.status(500).json({ error: "Failed to delete alarm" });
  }
});

export default router;
