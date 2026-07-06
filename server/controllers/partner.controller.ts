import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { PartnerService } from "../services/partner.service";
import { getAllowedOwnerIds } from "../utils/auth.util";

export class PartnerController {
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      let ownerId = req.user!.uid;

      if (req.user!.role === "superadmin") {
        const centerId = req.body.centerId || req.query.centerId;
        if (!centerId || typeof centerId !== "string") {
          return res.status(400).json({ success: false, error: "Vui lòng chọn trung tâm quản lý." });
        }
        ownerId = centerId;
      }

      const partner = await PartnerService.createPartner(ownerId, req.body);
      res.status(201).json({ success: true, data: partner });
    } catch (error: unknown) {
      next(error);
    }
  }

  static async getList(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ownerId = await getAllowedOwnerIds(req.user!);
      const result = await PartnerService.getPartners(ownerId, req.query);
      res.json({ success: true, ...result });
    } catch (error: unknown) {
      next(error);
    }
  }

  static async getDetail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ownerId = await getAllowedOwnerIds(req.user!);
      const partner = await PartnerService.getPartnerById(ownerId, req.params.id);
      if (!partner) {
        return res.status(404).json({ success: false, error: "Không tìm thấy đối tác." });
      }
      res.json({ success: true, data: partner });
    } catch (error: unknown) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ownerId = await getAllowedOwnerIds(req.user!);
      const partner = await PartnerService.updatePartner(ownerId, req.params.id, req.body);
      if (!partner) {
        return res.status(404).json({ success: false, error: "Không tìm thấy đối tác để cập nhật." });
      }
      res.json({ success: true, data: partner });
    } catch (error: unknown) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ownerId = await getAllowedOwnerIds(req.user!);
      const partner = await PartnerService.deletePartner(ownerId, req.params.id);
      if (!partner) {
        return res.status(404).json({ success: false, error: "Không tìm thấy đối tác để xóa." });
      }
      res.json({ success: true, data: partner });
    } catch (error: unknown) {
      next(error);
    }
  }

  static async addPayout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ownerId = await getAllowedOwnerIds(req.user!);
      const partner = await PartnerService.addPayout(ownerId, req.params.id, req.body);
      res.json({ success: true, data: partner });
    } catch (error: unknown) {
      next(error);
    }
  }
}
