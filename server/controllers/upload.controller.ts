import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";

export class UploadController {
  static async uploadFile(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: "Không tìm thấy tệp tin nào được gửi." });
      }

      // Multer-storage-cloudinary populates req.file.path with the secure Cloudinary HTTPS URL
      const fileUrl = req.file.path;
      const fileName = req.file.originalname;
      const fileType = req.file.mimetype;

      res.status(200).json({
        success: true,
        data: {
          url: fileUrl,
          name: fileName,
          type: fileType,
          uploadedAt: new Date().toISOString(),
        },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi upload tệp.";
      res.status(500).json({ success: false, error: msg });
    }
  }
}
