import { Response, NextFunction } from "express";
import { StudentService } from "../services/student.service";
import { AuthRequest } from "../middlewares/auth.middleware";

export class StudentController {
  static async create(req: AuthRequest, res: Response, _next: NextFunction) {
    try {
      const ownerId = req.user!.uid;
      const student = await StudentService.createStudent(ownerId, req.body);
      res.status(201).json({ success: true, data: student });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi không xác định.";
      res.status(400).json({ success: false, error: msg });
    }
  }

  static async getList(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user!.uid;
      const result = await StudentService.getStudents(ownerId, req.query);
      res.json({ success: true, ...result });
    } catch (error: unknown) {
      next(error);
    }
  }

  static async getDetail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user!.uid;
      const student = await StudentService.getStudentById(ownerId, req.params.id);
      if (!student) {
        return res.status(404).json({ success: false, error: "Không tìm thấy học viên." });
      }
      res.json({ success: true, data: student });
    } catch (error: unknown) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, _next: NextFunction) {
    try {
      const ownerId = req.user!.uid;
      const student = await StudentService.updateStudent(ownerId, req.params.id, req.body);
      if (!student) {
        return res.status(404).json({ success: false, error: "Không tìm thấy học viên để cập nhật." });
      }
      res.json({ success: true, data: student });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi không xác định.";
      res.status(400).json({ success: false, error: msg });
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user!.uid;
      const student = await StudentService.deleteStudent(ownerId, req.params.id);
      if (!student) {
        return res.status(404).json({ success: false, error: "Không tìm thấy học viên để xóa." });
      }
      res.json({ success: true, data: student });
    } catch (error: unknown) {
      next(error);
    }
  }
}
