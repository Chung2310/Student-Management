import { Router } from "express";
import { UploadController } from "../controllers/upload.controller";
import { upload } from "../config/cloudinary";

const router = Router();

// Public: used by the anonymous student self-registration flow (/register)
// to upload ID card / portrait images before an account/token exists.
// Middleware upload.single("file") extracts the "file" field from multipart data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post("/", upload.single("file") as any, UploadController.uploadFile as any);

export default router;
