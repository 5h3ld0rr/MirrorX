import { Router, Request, Response } from "express";
import { db } from "../config/firebase.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

// Get all notes for a user
router.get("/", verifyToken as any, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const snapshot = await db.collection("users").doc(uid).collection("notes").orderBy("updatedAt", "desc").get();
    
    const notes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(notes);
  } catch (error: any) {
    console.error("❌ Error fetching notes:", error.message);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// Create a new note
router.post("/", verifyToken as any, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const { title, content, color } = req.body;

    if (!title && !content) {
      return res.status(400).json({ error: "Note must have a title or content" });
    }

    const newNote = {
      title: title || "",
      content: content || "",
      color: color || "#00f2ff",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await db.collection("users").doc(uid).collection("notes").add(newNote);
    
    res.json({ id: docRef.id, ...newNote });
  } catch (error: any) {
    console.error("❌ Error creating note:", error.message);
    res.status(500).json({ error: "Failed to create note" });
  }
});

// Update a note
router.patch("/:id", verifyToken as any, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const { id } = req.params;
    const { title, content, color } = req.body;

    const updateData: any = {
      updatedAt: new Date().toISOString()
    };
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (color !== undefined) updateData.color = color;

    await db.collection("users").doc(uid as string).collection("notes").doc(id as string).update(updateData);
    
    res.json({ id, ...updateData });
  } catch (error: any) {
    console.error("❌ Error updating note:", error.message);
    res.status(500).json({ error: "Failed to update note" });
  }
});

// Delete a note
router.delete("/:id", verifyToken as any, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const { id } = req.params;

    await db.collection("users").doc(uid as string).collection("notes").doc(id as string).delete();
    
    res.json({ message: "Note deleted successfully" });
  } catch (error: any) {
    console.error("❌ Error deleting note:", error.message);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

export default router;
