import { Request, Response } from "express";
import { auth, db, admin } from "../config/firebase";
import * as faceService from "../services/faceService";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const photoBuffer = (req as any).file?.buffer;

    if (!name || !email || !photoBuffer) {
        return res.status(400).json({ error: "Missing required fields: name, email, photo" });
    }

    // Biometric analysis
    const analysis = await faceService.analyzeFace(photoBuffer);

    if (!analysis.success) {
      if (analysis.reason === "TOO_FAR") {
        return res.status(400).json({ error: "Please come closer to the mirror. Your face is too far away." });
      }
      return res.status(400).json({ error: "No face detected in the photo." });
    }

    const faceDescriptor = analysis.descriptor;

    // Firebase Auth synchronization
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        const createParams: any = {
          email: email,
          displayName: name,
        };
        if (password) createParams.password = password;
        userRecord = await auth.createUser(createParams);
      } else {
        throw e;
      }
    }

    // Convert to Base64 for initial photoURL
    const photoURL = `data:${(req as any).file.mimetype};base64,${photoBuffer.toString('base64')}`;

    // Save to Firestore with biometric descriptor
    await db.collection("users").doc(userRecord.uid).set({
      name: name,
      email: email,
      photoURL: photoURL,
      faceDescriptor: faceDescriptor,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    const customToken = await auth.createCustomToken(userRecord.uid);

    res.status(201).json({ 
        message: "✅ Face registration successful.", 
        userId: userRecord.uid,
        token: customToken,
        user: {
          uid: userRecord.uid,
          name: name,
          email: email,
          photoURL: photoURL
        }
    });

  } catch (error: any) {
    console.error("❌ Registration Error:", error.message);
    res.status(500).json({ error: "Internal server error during registration." });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const photoBuffer = (req as any).file?.buffer;

    if (!photoBuffer) {
        return res.status(400).json({ error: "No image provided." });
    }

    const analysis = await faceService.analyzeFace(photoBuffer);
    if (!analysis.success) {
      if (analysis.reason === "TOO_FAR") {
        return res.status(400).json({ error: "Face detected, but you are too far away. Please come closer." });
      }
      return res.status(400).json({ error: "No face detected in the login image." });
    }

    const currentDescriptor = analysis.descriptor as number[];

    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const matchedUser = faceService.findBestMatch(currentDescriptor, users);

    if (!matchedUser) {
      return res.status(401).json({ error: "Face not recognized." });
    }

    const customToken = await auth.createCustomToken(matchedUser.id);
    
    res.json({
      success: true,
      token: customToken,
      user: {
        uid: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        photoURL: (matchedUser as any).photoURL
      }
    });

  } catch (error: any) {
    console.error("❌ Login Error:", error.message);
    res.status(500).json({ error: "Internal server error during face login." });
  }
};
