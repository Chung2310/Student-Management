import { Response, NextFunction } from "express";
import { NotificationService } from "../services/notification.service";
import { AuthRequest } from "../middlewares/auth.middleware";

export class NotificationController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const ownerId = req.user!.uid;
      const notification = await NotificationService.createNotification(ownerId, req.body);
      res.status(201).json({ success: true, data: notification });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi không xác định.";
      res.status(400).json({ success: false, error: msg });
    }
  }

  static async getList(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user!.uid;
      const result = await NotificationService.getNotifications(ownerId, req.query);
      res.json({ success: true, ...result });
    } catch (error: unknown) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const ownerId = req.user!.uid;
      const notification = await NotificationService.deleteNotification(ownerId, req.params.id);
      if (!notification) {
        return res.status(404).json({ success: false, error: "Không tìm thấy thông báo để xóa." });
      }
      res.json({ success: true, data: notification });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi không xác định.";
      res.status(400).json({ success: false, error: msg });
    }
  }
}
