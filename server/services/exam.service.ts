import { Exam } from "../models/exam.model";
import { Student } from "../models/student.model";
import { IExam } from "../interfaces/exam.interface";
import { logger } from "../config/logger";

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
    logger.info(`[Exam] Creating exam for ownerId=${ownerId}, data=${JSON.stringify(data)}`);
    const exam = new Exam({
      ...data,
      ownerId,
    });
    const savedExam = await exam.save();
    logger.info(`[Exam] Exam created successfully: id=${savedExam._id}, name=${savedExam.name}`);
    return savedExam;
  }

  static async getExams(ownerId: string, filters: ExamFilters) {
    logger.info(`[Exam] Fetching exams for ownerId=${ownerId} with filters: ${JSON.stringify(filters)}`);
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

    logger.info(`[Exam] Fetched ${exams.length} exams (total=${total}) for ownerId=${ownerId}`);
    return {
      exams,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getExamById(ownerId: string, id: string): Promise<IExam | null> {
    logger.info(`[Exam] Fetching exam detail: id=${id}, ownerId=${ownerId}`);
    return await Exam.findOne({ _id: id, ownerId });
  }

  static async updateExam(ownerId: string, id: string, data: ExamUpdateData): Promise<IExam | null> {
    logger.info(`[Exam] Updating exam: id=${id}, ownerId=${ownerId}`);
    const updatedExam = await Exam.findOneAndUpdate(
      { _id: id, ownerId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (updatedExam) {
      logger.info(`[Exam] Exam updated successfully: id=${id}`);
    } else {
      logger.warn(`[Exam] Exam update failed/not found: id=${id}, ownerId=${ownerId}`);
    }
    return updatedExam;
  }

  static async deleteExam(ownerId: string, id: string): Promise<IExam | null> {
    logger.info(`[Exam] Deleting exam: id=${id}, ownerId=${ownerId}`);
    const deletedExam = await Exam.findOneAndDelete({ _id: id, ownerId });
    if (deletedExam) {
      logger.info(`[Exam] Exam deleted successfully: id=${id}`);
    } else {
      logger.warn(`[Exam] Exam delete failed/not found: id=${id}, ownerId=${ownerId}`);
    }
    return deletedExam;
  }

  static async assignStudents(ownerId: string, examId: string, studentIds: string[]): Promise<{ success: boolean }> {
    logger.info(`[Exam] Assigning ${studentIds.length} students to examId=${examId}, ownerId=${ownerId}`);
    const exam = await Exam.findOne({ _id: examId, ownerId });
    if (!exam) {
      logger.warn(`[Exam] Assign students failed - Exam not found: id=${examId}, ownerId=${ownerId}`);
      throw new Error("Kỳ thi không tồn tại.");
    }

    // Update students (assign to exam and add to history)
    const updateResult = await Student.updateMany(
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
            result: { theory: 0, practice: 0, simulation: 0, overall: "Chưa có" }
          }
        }
      }
    );
    logger.info(`[Exam] Assigned students updated database: matchedCount=${updateResult.matchedCount}, modifiedCount=${updateResult.modifiedCount}`);

    // Update exam student count
    exam.studentCount += studentIds.length;
    await exam.save();
    logger.info(`[Exam] Updated studentCount for examId=${examId} to: ${exam.studentCount}`);

    return { success: true };
  }
}
