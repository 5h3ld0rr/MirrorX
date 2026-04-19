import { Router, Request, Response } from "express";
import { db, admin } from "../config/firebase.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import multer from "multer";
import sharp from "sharp";

const router = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit for intake

router.get("/profile", verifyToken as any, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const userDoc = await db.collection("users").doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ uid, ...userDoc.data() });
  } catch (error: any) {
    console.error("❌ Error fetching profile:", error.message);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

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

router.patch("/profile", verifyToken as any, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const { name, bio } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    await db.collection("users").doc(uid).set(updateData, { merge: true });

    if (name) {
      await admin.auth().updateUser(uid, {
        displayName: name
      });
    }

    res.json({ message: "Profile updated successfully", user: { uid, ...updateData } });
  } catch (error: any) {
    console.error("❌ Error updating profile:", error.message);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.patch("/profile-picture", verifyToken as any, upload.single("photo"), async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const photoBuffer = (req as any).file?.buffer;

    if (!photoBuffer) {
      return res.status(400).json({ error: "No photo provided" });
    }

    console.log("📷 Processing photo for user:", uid);

    // Optimize image: rotate to fix phone orientation, resize, and compress
    const optimizedBuffer = await sharp(photoBuffer)
      .rotate() // Automatically rotate based on EXIF orientation
      .resize(800, 800, {
        fit: 'inside', // Don't crop, just fit inside the bounds
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toBuffer();

    // Convert to Base64 (Data URI)
    const base64Image = `data:image/webp;base64,${optimizedBuffer.toString('base64')}`;

    console.log("🚀 Optimized size:", (optimizedBuffer.length / 1024).toFixed(2), "KB");

    // Clear and set to ensure we don't exceed Firestore 1MB limit accidentally
    await db.collection("users").doc(uid).set({
      photoURL: base64Image
    }, { merge: true });

    // Note: admin.auth().updateUser(uid, { photoURL: base64Image }) is skipped 
    // because Firebase Auth requires a public URL, not a Data URI.
    // The Frontend will use the Firestore photoURL instead.

    res.json({ message: "Profile picture optimized and updated", photoURL: base64Image });
  } catch (error: any) {
    console.error("❌ Error optimizing/updating profile picture:", error.message);
    let errorMessage = "Failed to process image. Please try a different photo.";
    if (error.message.includes('Support for this compression format')) {
      errorMessage = "iPhone (HEIC) photos are not yet supported. Please use a JPG or PNG photo.";
    }
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
