import { Student } from "../models/student.model";
import { IStudent } from "../interfaces/student.interface";
import { logger } from "../config/logger";

interface StudentFilters {
  page?: number | string;
  limit?: number | string;
  status?: string;
  rank?: string;
  area?: string;
  search?: string;
}

interface StudentCreateData {
  phone: string;
  [key: string]: unknown;
}

interface StudentUpdateData {
  [key: string]: unknown;
}

export class StudentService {
  static async createStudent(ownerId: string, data: StudentCreateData): Promise<IStudent> {
    logger.info(`[Student] Creating student for ownerId=${ownerId}, phone=${data.phone}`);
    const existing = await Student.findOne({ phone: data.phone, ownerId });
    if (existing) {
      logger.warn(`[Student] Create student failed - Phone ${data.phone} already exists for ownerId=${ownerId}`);
      throw new Error("Số điện thoại này đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!");
    }

    const student = new Student({
      ...data,
      ownerId,
    });
    const savedStudent = await student.save();
    logger.info(`[Student] Student created successfully: id=${savedStudent._id}, phone=${savedStudent.phone}`);
    return savedStudent;
  }

  static async getStudents(ownerId: string, filters: StudentFilters) {
    logger.info(`[Student] Fetching students list for ownerId=${ownerId} with filters: ${JSON.stringify(filters)}`);
    const page = filters.page ? parseInt(String(filters.page)) : 1;
    const limit = filters.limit ? parseInt(String(filters.limit)) : 1000;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { ownerId };

    if (filters.status) query.status = filters.status;
    if (filters.rank) query.rank = filters.rank;
    if (filters.area) query.area = filters.area;
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, "i");
      query.$or = [{ fullName: searchRegex }, { phone: searchRegex }];
    }

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    logger.info(`[Student] Fetched ${students.length} students (total=${total}) for ownerId=${ownerId}`);
    return {
      students,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getStudentById(ownerId: string, id: string): Promise<IStudent | null> {
    logger.info(`[Student] Fetching student detail: id=${id}, ownerId=${ownerId}`);
    return await Student.findOne({ _id: id, ownerId });
  }

  static async updateStudent(ownerId: string, id: string, data: StudentUpdateData): Promise<IStudent | null> {
    logger.info(`[Student] Updating student: id=${id}, ownerId=${ownerId}`);
    
    if (data.paymentHistory && Array.isArray(data.paymentHistory)) {
      const history = data.paymentHistory as Record<string, unknown>[];
      data.paidAmount = history.reduce((sum: number, item) => sum + (Number(item?.amount) || 0), 0);
    }

    const updatedStudent = await Student.findOneAndUpdate(
      { _id: id, ownerId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (updatedStudent) {
      logger.info(`[Student] Student updated successfully: id=${id}`);
    } else {
      logger.warn(`[Student] Student update failed/not found: id=${id}, ownerId=${ownerId}`);
    }
    return updatedStudent;
  }

  static async deleteStudent(ownerId: string, id: string): Promise<IStudent | null> {
    logger.info(`[Student] Deleting student: id=${id}, ownerId=${ownerId}`);
    const deletedStudent = await Student.findOneAndDelete({ _id: id, ownerId });
    if (deletedStudent) {
      logger.info(`[Student] Student deleted successfully: id=${id}`);
    } else {
      logger.warn(`[Student] Student delete failed/not found: id=${id}, ownerId=${ownerId}`);
    }
    return deletedStudent;
  }
}
