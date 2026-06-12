import { Router } from "express";
import { UploadController } from "../controllers/upload.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { upload } from "../config/cloudinary";

const router = Router();

router.use(authMiddleware);

// Middleware upload.single("file") extracts the "file" field from multipart data
router.post("/", upload.single("file"), UploadController.uploadFile);

export default router;
