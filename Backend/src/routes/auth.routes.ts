import { Router } from "express";
import * as authController from "../controllers/authController";
import multer from "multer";

const router = Router();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

router.post("/register", upload.single("photo"), authController.register);
router.post("/login", upload.single("photo"), authController.login);

export default router;
