import { Student } from "../models/student.model";
import { IStudent } from "../interfaces/student.interface";

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
    const existing = await Student.findOne({ phone: data.phone, ownerId });
    if (existing) {
      throw new Error("Số điện thoại này đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!");
    }

    const student = new Student({
      ...data,
      ownerId,
    });
    return await student.save();
  }

  static async getStudents(ownerId: string, filters: StudentFilters) {
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

    return {
      students,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getStudentById(ownerId: string, id: string): Promise<IStudent | null> {
    return await Student.findOne({ _id: id, ownerId });
  }

  static async updateStudent(ownerId: string, id: string, data: StudentUpdateData): Promise<IStudent | null> {
    return await Student.findOneAndUpdate(
      { _id: id, ownerId },
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  static async deleteStudent(ownerId: string, id: string): Promise<IStudent | null> {
    return await Student.findOneAndDelete({ _id: id, ownerId });
  }
}
