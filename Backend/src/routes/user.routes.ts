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

    const userData = userDoc.data() || {};
    const preferences = userData.preferences || {};
    const rgbController = preferences.rgbController || {};

    // Combine for frontend compatibility
    res.json({
      uid,
      ...userData,
      // Flatten preferences into root for existing frontend components
      accentColor: preferences.accentColor || userData.accentColor,
      appBrightness: preferences.appBrightness !== undefined ? preferences.appBrightness : userData.appBrightness,
      standByDelay: preferences.standByDelay !== undefined ? preferences.standByDelay : (userData.standByDelay !== undefined ? userData.standByDelay : userData.standbyDelay),
      terminationDelay: preferences.terminationDelay !== undefined ? preferences.terminationDelay : (userData.terminationDelay !== undefined ? userData.terminationDelay : userData.logoutDelay),
      // Flatten RGB
      rgbColor: rgbController.r !== undefined ? { r: rgbController.r, g: rgbController.g, b: rgbController.b } : userData.rgbColor,
      brightness: rgbController.brightness !== undefined ? rgbController.brightness : userData.brightness,
      // Widget Settings
      widgetSettings: preferences.widgetSettings || userData.widgetSettings,
      musicSyncEnabled: rgbController.musicSyncEnabled !== undefined ? rgbController.musicSyncEnabled : userData.musicSyncEnabled
    });
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

    // Traditional fields
    const updateData: any = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.bio !== undefined) updateData.bio = req.body.bio;
    if (req.body.photoURL !== undefined) updateData.photoURL = req.body.photoURL;

    // Preferences flattened -> Nested mapping
    if (req.body.accentColor !== undefined) updateData['preferences.accentColor'] = req.body.accentColor;
    if (req.body.appBrightness !== undefined) updateData['preferences.appBrightness'] = req.body.appBrightness;
    if (req.body.standbyDelay !== undefined) updateData['preferences.standByDelay'] = req.body.standbyDelay;
    if (req.body.logoutDelay !== undefined) updateData['preferences.terminationDelay'] = req.body.logoutDelay;

    // RGB Controller mapping
    if (req.body.rgbColor !== undefined) {
      updateData['preferences.rgbController.r'] = req.body.rgbColor.r;
      updateData['preferences.rgbController.g'] = req.body.rgbColor.g;
      updateData['preferences.rgbController.b'] = req.body.rgbColor.b;
    }
    if (req.body.brightness !== undefined) {
      updateData['preferences.rgbController.brightness'] = req.body.brightness;
    }
    if (req.body.widgetSettings !== undefined) {
      updateData['preferences.widgetSettings'] = req.body.widgetSettings;
    }
    if (req.body.musicSyncEnabled !== undefined) {
      updateData['preferences.rgbController.musicSyncEnabled'] = req.body.musicSyncEnabled;
    }
    if (req.body.calendarEvents !== undefined) {
      updateData.calendarEvents = req.body.calendarEvents;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    // Use update() to support dot-notation nested updates in Firestore
    await db.collection("users").doc(uid).update(updateData);

    if (req.body.name) {
      await admin.auth().updateUser(uid, {
        displayName: req.body.name
      });
    }

    res.json({ message: "Profile updated successfully", updatedFields: Object.keys(updateData) });
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
