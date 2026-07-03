import { Request, Response, NextFunction } from "express";
import { StudentService } from "../services/student.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { AuthService } from "../services/auth.service";
import { getAllowedOwnerIds, getCenterOwnerIds } from "../utils/auth.util";

export class StudentController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const ownerId = req.user!.uid;
      const centerOwnerIds = await getCenterOwnerIds(req.user!);
      const student = await StudentService.createStudent(ownerId, centerOwnerIds, req.body);
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
      const centerOwnerIds = await getCenterOwnerIds(req.user!);
      const student = await StudentService.updateStudent(ownerId, centerOwnerIds, req.params.id, req.body);
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
      const ownerId = await getCenterOwnerIds(req.user!);
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

      const teacherScope = teacher.centerId === "superadmin"
        ? "ALL"
        : await getCenterOwnerIds({ uid: teacherId, role: teacher.role, centerId: teacher.centerId });
      const student = await StudentService.createStudent(teacherId, teacherScope, payload);
      res.status(201).json({ success: true, data: student });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi không xác định.";
      res.status(400).json({ success: false, error: msg });
    }
  }

  /**
   * PATCH /students/:id/installment/:no/mark-paid
   * Đánh dấu đã thu tiền đợt :no cho học viên :id
   */
  static async markInstallmentPaid(req: AuthRequest, res: Response) {
    try {
      const ownerId = await getAllowedOwnerIds(req.user!);
      const { id, no } = req.params;
      const installmentNo = parseInt(no, 10);

      if (isNaN(installmentNo) || installmentNo < 1) {
        return res.status(400).json({ success: false, error: "Số đợt không hợp lệ." });
      }

      const result = await StudentService.markInstallmentPaid(ownerId, id, installmentNo);
      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }
      res.json({ success: true, message: `Đã đánh dấu đã thu đợt ${installmentNo}.` });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi không xác định.";
      res.status(400).json({ success: false, error: msg });
    }
  }

  static async publicLookup(req: Request, res: Response) {
    try {
      const { idCard } = req.query;
      if (!idCard || typeof idCard !== "string") {
        return res.status(400).json({ success: false, error: "Vui lòng nhập số CCCD." });
      }

      const student = await StudentService.getStudentByIdCard(idCard.trim());
      if (!student) {
        return res.status(404).json({ success: false, error: "Không tìm thấy thông tin học viên với số CCCD này." });
      }

      res.json({ success: true, data: student });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi không xác định.";
      res.status(400).json({ success: false, error: msg });
    }
  }
}
