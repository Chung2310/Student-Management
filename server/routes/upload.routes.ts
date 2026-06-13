import { Router } from "express";
import { UploadController } from "../controllers/upload.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { upload } from "../config/cloudinary";

const router = Router();

router.use(authMiddleware);

// Middleware upload.single("file") extracts the "file" field from multipart data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post("/", upload.single("file") as any, UploadController.uploadFile as any);

export default router;
