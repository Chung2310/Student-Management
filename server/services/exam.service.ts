import { Exam } from "../models/exam.model";
import { Student } from "../models/student.model";
import { IExam } from "../interfaces/exam.interface";

interface ExamFilters {
  page?: number | string;
  limit?: number | string;
  status?: string;
  rank?: string;
  area?: string;
}

interface ExamCreateData {
  [key: string]: unknown;
}

interface ExamUpdateData {
  [key: string]: unknown;
}

export class ExamService {
  static async createExam(ownerId: string, data: ExamCreateData): Promise<IExam> {
    const exam = new Exam({
      ...data,
      ownerId,
    });
    return await exam.save();
  }

  static async getExams(ownerId: string, filters: ExamFilters) {
    const page = filters.page ? parseInt(String(filters.page)) : 1;
    const limit = filters.limit ? parseInt(String(filters.limit)) : 1000;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { ownerId };
    if (filters.status) query.status = filters.status;
    if (filters.rank) query.rank = filters.rank;
    if (filters.area) query.area = filters.area;

    const total = await Exam.countDocuments(query);
    const exams = await Exam.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      exams,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getExamById(ownerId: string, id: string): Promise<IExam | null> {
    return await Exam.findOne({ _id: id, ownerId });
  }

  static async updateExam(ownerId: string, id: string, data: ExamUpdateData): Promise<IExam | null> {
    return await Exam.findOneAndUpdate(
      { _id: id, ownerId },
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  static async deleteExam(ownerId: string, id: string): Promise<IExam | null> {
    return await Exam.findOneAndDelete({ _id: id, ownerId });
  }

  static async assignStudents(ownerId: string, examId: string, studentIds: string[]): Promise<{ success: boolean }> {
    const exam = await Exam.findOne({ _id: examId, ownerId });
    if (!exam) {
      throw new Error("Kỳ thi không tồn tại.");
    }

    // Update students (assign to exam and add to history)
    await Student.updateMany(
      { _id: { $in: studentIds }, ownerId },
      {
        $set: {
          examId: exam._id.toString(),
          examName: exam.name,
          examDate: exam.tentativeDate,
          status: "Đang thi",
        },
        $push: {
          exams: {
            id: exam._id.toString(),
            name: exam.name,
            date: exam.tentativeDate,
            type: "Sát hạch",
            status: "Sắp thi",
            result: { theory: 0, practice: 0, simulation: 0, overall: "Chờ kết quả" }
          }
        }
      }
    );

    // Update exam student count
    exam.studentCount += studentIds.length;
    await exam.save();

    return { success: true };
  }
}
