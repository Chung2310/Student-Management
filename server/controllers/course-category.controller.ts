import { Response, NextFunction } from "express";
import { CourseCategoryService } from "../services/course-category.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { getAllowedOwnerIds } from "../utils/auth.util";

export class CourseCategoryController {
  static async getList(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ownerId = await getAllowedOwnerIds(req.user!);
      const categories = await CourseCategoryService.getCategories(ownerId);
      res.json({ success: true, data: categories });
    } catch (error: unknown) {
      next(error);
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      const ownerId = req.user!.uid;
      const { name } = req.body;
      const category = await CourseCategoryService.createCategory(ownerId, name);
      res.status(201).json({ success: true, data: category });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi không xác định.";
      res.status(400).json({ success: false, error: msg });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const ownerId = await getAllowedOwnerIds(req.user!);
      const category = await CourseCategoryService.deleteCategory(ownerId, req.params.id);
      if (!category) {
        return res.status(404).json({ success: false, error: "Không tìm thấy phân loại." });
      }
      res.json({ success: true, data: category });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi không xác định.";
      res.status(400).json({ success: false, error: msg });
    }
  }
}
