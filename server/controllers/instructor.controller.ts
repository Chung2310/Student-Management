import { Response, NextFunction } from "express";
import { InstructorService } from "../services/instructor.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { getAllowedOwnerIds } from "../utils/auth.util";

export class InstructorController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const ownerId = req.user!.uid;
      const instructor = await InstructorService.createInstructor(ownerId, req.body);
      res.status(201).json({ success: true, data: instructor });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi không xác định.";
      res.status(400).json({ success: false, error: msg });
    }
  }

  static async getList(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ownerId = await getAllowedOwnerIds(req.user!);
      const result = await InstructorService.getInstructors(ownerId, req.query);
      res.json({ success: true, ...result });
    } catch (error: unknown) {
      next(error);
    }
  }

  static async getDetail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ownerId = await getAllowedOwnerIds(req.user!);
      const instructor = await InstructorService.getInstructorById(ownerId, req.params.id);
      if (!instructor) {
        return res.status(404).json({ success: false, error: "Không tìm thấy giảng viên." });
      }
      res.json({ success: true, data: instructor });
    } catch (error: unknown) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const ownerId = await getAllowedOwnerIds(req.user!);
      const instructor = await InstructorService.updateInstructor(ownerId, req.params.id, req.body);
      if (!instructor) {
        return res.status(404).json({ success: false, error: "Không tìm thấy giảng viên để cập nhật." });
      }
      res.json({ success: true, data: instructor });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi không xác định.";
      res.status(400).json({ success: false, error: msg });
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ownerId = await getAllowedOwnerIds(req.user!);
      const instructor = await InstructorService.deleteInstructor(ownerId, req.params.id);
      if (!instructor) {
        return res.status(404).json({ success: false, error: "Không tìm thấy giảng viên để xóa." });
      }
      res.json({ success: true, data: instructor });
    } catch (error: unknown) {
      next(error);
    }
  }
}
