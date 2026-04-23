import { Router, Request, Response } from "express";
import { db } from "../config/firebase.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * MirrorX Music Playlist API
 * Managing user playlists in Firestore.
 */

// Get all playlists for a user
router.get("/", verifyToken as any, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const snapshot = await db.collection("users").doc(uid).collection("playlists").get();
    
    const playlists = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(playlists);
  } catch (error: any) {
    console.error("❌ Error fetching playlists:", error.message);
    res.status(500).json({ error: "Failed to fetch playlists" });
  }
});

// Create a new playlist
router.post("/", verifyToken as any, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const { name, tracks } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Playlist must have a name" });
    }

    const newPlaylist = {
      name,
      tracks: tracks || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await db.collection("users").doc(uid).collection("playlists").add(newPlaylist);
    
    res.json({ id: docRef.id, ...newPlaylist });
  } catch (error: any) {
    console.error("❌ Error creating playlist:", error.message);
    res.status(500).json({ error: "Failed to create playlist" });
  }
});

// Update a playlist (tracks or name)
router.patch("/:id", verifyToken as any, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const { id } = req.params;
    const { name, tracks } = req.body;

    const updateData: any = {
      updatedAt: new Date().toISOString()
    };
    if (name !== undefined) updateData.name = name;
    if (tracks !== undefined) updateData.tracks = tracks;

    await db.collection("users").doc(uid as string).collection("playlists").doc(id as string).update(updateData);
    
    res.json({ id, ...updateData });
  } catch (error: any) {
    console.error("❌ Error updating playlist:", error.message);
    res.status(500).json({ error: "Failed to update playlist" });
  }
});

// Delete a playlist
router.delete("/:id", verifyToken as any, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const { id } = req.params;

    await db.collection("users").doc(uid as string).collection("playlists").doc(id as string).delete();
    
    res.json({ message: "Playlist deleted successfully" });
  } catch (error: any) {
    console.error("❌ Error deleting playlist:", error.message);
    res.status(500).json({ error: "Failed to delete playlist" });
  }
});

export default router;
