import * as faceapi from "face-api.js";
import * as tf from "@tensorflow/tfjs";
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Monkey patch face-api.js for Node.js
// @ts-ignore
faceapi.env.monkeyPatch({
  Canvas: (global as any).Canvas || class {},
  Image: (global as any).Image || class {},
  ImageData: (global as any).ImageData || class {}
});

// Model path
const modelPath = path.join(__dirname, "../../models").replace(/\\/g, "/");

let isLoaded = false;

// Optimization: Pre-load the models
export async function loadModels() {
  if (isLoaded) return;
  
  try {
    // SSD Mobilenet V1 is more accurate but slower. Tiny Face Detector is faster.
    // Given it's a smart mirror, let's use SSD for better security if possible, 
    // or Tiny for responsiveness. We'll use Tiny for now for mirror performance.
    await faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
    
    isLoaded = true;
    console.log("✅ Face-api models loaded (TinyFaceDetector).");
  } catch (error: any) {
    console.error("❌ Error loading face-api models:", error.message);
    throw error;
  }
}

/**
 * Extract embeddings and analyze face distance.
 * Returns { success, descriptor, reason }
 */
export async function analyzeFace(imageBuffer: Buffer) {
  try {
    await loadModels();
    
    const { data, info } = await sharp(imageBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
      
    const { width, height } = info;
    
    const tensor = tf.tidy(() => {
      return tf.tensor3d(new Uint8Array(data), [height, width, 4])
               .slice([0, 0, 0], [height, width, 3]);
    });

    const detection = await faceapi.detectSingleFace(tensor as any, new faceapi.TinyFaceDetectorOptions())
                                  .withFaceLandmarks()
                                  .withFaceDescriptor();
    
    tf.dispose(tensor);

    if (!detection) {
      return { success: false, reason: "NO_FACE" };
    }
    
    // Distance detection: measure the face width relative to the image width
    // If the face is less than 25% of the frame width, the user is likely too far for reliable auth.
    const faceWidthRatio = detection.detection.box.width / width;
    const MIN_FACE_RATIO = 0.25; 

    if (faceWidthRatio < MIN_FACE_RATIO) {
      return { success: false, reason: "TOO_FAR", ratio: faceWidthRatio };
    }
    
    return { 
      success: true, 
      descriptor: Array.from(detection.descriptor) 
    };
  } catch (err: any) {
    console.error("❌ Face Analysis Error:", err);
    return { success: false, reason: "ERROR" };
  }
}

/**
 * Compare two descriptors using Euclidean Distance.
 * Threshold of 0.6 is typical for face-api.js.
 */
export function findBestMatch(currentDescriptor: number[], storedUsers: any[], threshold = 0.5) {
  let bestMatch = null;
  let minDistance = Infinity;

  const currentVec = new Float32Array(currentDescriptor);

  for (const user of storedUsers) {
    if (!user.faceDescriptor) continue;
    
    const storedVec = new Float32Array(user.faceDescriptor);
    
    // Calculate Euclidean Distance
    let distance = 0;
    for (let i = 0; i < currentVec.length; i++) {
        distance += Math.pow(currentVec[i] - storedVec[i], 2);
    }
    distance = Math.sqrt(distance);

    if (distance < threshold && distance < minDistance) {
      minDistance = distance;
      bestMatch = user;
    }
  }

  return bestMatch;
}
