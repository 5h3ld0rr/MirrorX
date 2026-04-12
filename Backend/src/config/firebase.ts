import admin from "firebase-admin";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, "../../service-account.json");

/**
 * Initialize Firebase Admin Service
 * Enterprise configuration for MirrorX biometric data streaming.
 */
let serviceAccount: any;
try {
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
} catch (error: any) {
  console.error("❌ Failed to load service-account.json:", error.message);
  process.exit(1);
}

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
  console.log(`✅ Firebase Gateway initialized: ${serviceAccount.project_id}`);
}

export const auth = admin.auth();
export const db = admin.firestore();
export { admin };
