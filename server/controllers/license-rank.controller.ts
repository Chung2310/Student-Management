import { Response, NextFunction } from "express";
import { LicenseRankService } from "../services/license-rank.service";
import { AuthRequest } from "../middlewares/auth.middleware";

export class LicenseRankController {
  static async getList(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user!.role === "superadmin"
        ? "ALL"
        : ((req.user!.role === "user" && req.user!.centerId) ? req.user!.centerId : req.user!.uid);
      const ranks = await LicenseRankService.getRanks(ownerId, req.query as { ownerFilter?: string });
      res.json({ success: true, data: ranks });
    } catch (error: unknown) {
      next(error);
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      const ownerId = req.user!.role === "superadmin"
        ? "ALL"
        : ((req.user!.role === "user" && req.user!.centerId) ? req.user!.centerId : req.user!.uid);
      const { name } = req.body;
      const rank = await LicenseRankService.createRank(ownerId, name);
      res.status(201).json({ success: true, data: rank });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi không xác định.";
      res.status(400).json({ success: false, error: msg });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const ownerId = req.user!.role === "superadmin"
        ? "ALL"
        : ((req.user!.role === "user" && req.user!.centerId) ? req.user!.centerId : req.user!.uid);
      const rank = await LicenseRankService.deleteRank(ownerId, req.params.id);
      if (!rank) {
        return res.status(404).json({ success: false, error: "Không tìm thấy hạng bằng." });
      }
      res.json({ success: true, data: rank });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi không xác định.";
      res.status(400).json({ success: false, error: msg });
    }
  }
}
