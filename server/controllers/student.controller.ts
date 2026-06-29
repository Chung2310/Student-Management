import { Request, Response, NextFunction } from "express";
import { StudentService } from "../services/student.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { AuthService } from "../services/auth.service";
import { getAllowedOwnerIds } from "../utils/auth.util";

export class StudentController {
  static async create(req: AuthRequest, res: Response) {
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
      const ownerId = await getAllowedOwnerIds(req.user!);
      const result = await StudentService.getStudents(ownerId, req.query);
      res.json({ success: true, ...result });
    } catch (error: unknown) {
      next(error);
    }
  }

  static async getDetail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ownerId = await getAllowedOwnerIds(req.user!);
      const student = await StudentService.getStudentById(ownerId, req.params.id);
      if (!student) {
        return res.status(404).json({ success: false, error: "Không tìm thấy học viên." });
      }
      res.json({ success: true, data: student });
    } catch (error: unknown) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const ownerId = await getAllowedOwnerIds(req.user!);
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
      const ownerId = await getAllowedOwnerIds(req.user!);
      const student = await StudentService.deleteStudent(ownerId, req.params.id);
      if (!student) {
        return res.status(404).json({ success: false, error: "Không tìm thấy học viên để xóa." });
      }
      res.json({ success: true, data: student });
    } catch (error: unknown) {
      next(error);
    }
  }

  static async bulkCreate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const creatorId = req.user!.uid;
      const ownerId = await getAllowedOwnerIds(req.user!);
      const students = req.body.students;
      if (!Array.isArray(students)) {
        return res.status(400).json({ success: false, error: "Dữ liệu học viên không hợp lệ (phải là danh sách)." });
      }
      const result = await StudentService.bulkCreateStudents(creatorId, ownerId, students);
      res.status(200).json({ success: true, ...result });
    } catch (error: unknown) {
      next(error);
    }
  }

  static async publicRegister(req: Request, res: Response) {
    try {
      const { teacherId, ...studentData } = req.body;

      // Verify teacher exists
      const teacher = await AuthService.getUserProfile(teacherId);
      if (!teacher || teacher.isActive === false) {
        return res.status(400).json({ success: false, error: "Giáo viên không hợp lệ hoặc đã bị khóa tài khoản." });
      }

      // Default attributes for student registration
      const payload = {
        ...studentData,
        registrationDate: new Date().toLocaleDateString('vi-VN'),
        fee: "0",
        paidAmount: 0,
        status: "Chờ KSK",
      };

      const student = await StudentService.createStudent(teacherId, payload);
      res.status(201).json({ success: true, data: student });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi không xác định.";
      res.status(400).json({ success: false, error: msg });
    }
  }
}
