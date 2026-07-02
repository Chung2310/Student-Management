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

interface ImportResultItem {
  phone: string;
  overallResult: "Đậu" | "Trượt" | "Chưa có";
  theory?: number;
  practice?: number;
  simulation?: number;
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

  static async getExams(ownerId: string | string[], filters: ExamFilters) {
    logger.info(`[Exam] Fetching exams for ownerId=${ownerId} with filters: ${JSON.stringify(filters)}`);
    const page = filters.page ? parseInt(String(filters.page)) : 1;
    const limit = filters.limit ? parseInt(String(filters.limit)) : 1000;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (ownerId !== "ALL") {
      query.ownerId = Array.isArray(ownerId) ? { $in: ownerId } : ownerId;
    }
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

  static async getExamById(ownerId: string | string[], id: string): Promise<IExam | null> {
    logger.info(`[Exam] Fetching exam detail: id=${id}, ownerId=${ownerId}`);
    const query: Record<string, unknown> = { _id: id };
    if (ownerId !== "ALL") {
      query.ownerId = Array.isArray(ownerId) ? { $in: ownerId } : ownerId;
    }
    return await Exam.findOne(query);
  }

  static async updateExam(ownerId: string | string[], id: string, data: ExamUpdateData): Promise<IExam | null> {
    logger.info(`[Exam] Updating exam: id=${id}, ownerId=${ownerId}`);
    const query: Record<string, unknown> = { _id: id };
    if (ownerId !== "ALL") {
      query.ownerId = Array.isArray(ownerId) ? { $in: ownerId } : ownerId;
    }
    const updatedExam = await Exam.findOneAndUpdate(
      query,
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

  static async deleteExam(ownerId: string | string[], id: string): Promise<IExam | null> {
    logger.info(`[Exam] Deleting exam: id=${id}, ownerId=${ownerId}`);
    const query: Record<string, unknown> = { _id: id };
    if (ownerId !== "ALL") {
      query.ownerId = Array.isArray(ownerId) ? { $in: ownerId } : ownerId;
    }
    const deletedExam = await Exam.findOneAndDelete(query);
    if (deletedExam) {
      logger.info(`[Exam] Exam deleted successfully: id=${id}`);
    } else {
      logger.warn(`[Exam] Exam delete failed/not found: id=${id}, ownerId=${ownerId}`);
    }
    return deletedExam;
  }

  static async assignStudents(ownerId: string | string[], examId: string, studentIds: string[]): Promise<{ success: boolean }> {
    logger.info(`[Exam] Assigning ${studentIds.length} students to examId=${examId}, ownerId=${ownerId}`);
    const examQuery: Record<string, unknown> = { _id: examId };
    if (ownerId !== "ALL") {
      examQuery.ownerId = Array.isArray(ownerId) ? { $in: ownerId } : ownerId;
    }
    const exam = await Exam.findOne(examQuery);
    if (!exam) {
      logger.warn(`[Exam] Assign students failed - Exam not found: id=${examId}, ownerId=${ownerId}`);
      throw new Error("Kỳ thi không tồn tại.");
    }

    const studentQuery: Record<string, unknown> = { _id: { $in: studentIds } };
    if (ownerId !== "ALL") {
      studentQuery.ownerId = Array.isArray(ownerId) ? { $in: ownerId } : ownerId;
    }

    // Update students (assign to exam and add to history)
    const updateResult = await Student.updateMany(
      studentQuery,
      {
        $set: {
          examId: exam._id.toString(),
          examName: exam.name,
          examDate: exam.tentativeDate,
          status: ["Đang thi"],
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

  static async unassignStudent(
    ownerId: string | string[],
    examId: string,
    studentId: string
  ): Promise<{ success: boolean }> {
    logger.info(`[Exam] Unassigning studentId=${studentId} from examId=${examId}, ownerId=${ownerId}`);
    
    // Check if the exam exists
    const examQuery: Record<string, unknown> = { _id: examId };
    if (ownerId !== "ALL") {
      examQuery.ownerId = Array.isArray(ownerId) ? { $in: ownerId } : ownerId;
    }
    const exam = await Exam.findOne(examQuery);
    if (!exam) {
      logger.warn(`[Exam] Unassign student failed - Exam not found: id=${examId}, ownerId=${ownerId}`);
      throw new Error("Kỳ thi không tồn tại.");
    }

    // Find student who matches the studentId and ownerId and has active examId = examId
    const studentQuery: Record<string, unknown> = { _id: studentId, examId };
    if (ownerId !== "ALL") {
      studentQuery.ownerId = Array.isArray(ownerId) ? { $in: ownerId } : ownerId;
    }
    const student = await Student.findOne(studentQuery);
    if (!student) {
      logger.warn(`[Exam] Unassign student failed - Student not found or not assigned: studentId=${studentId}, examId=${examId}`);
      throw new Error("Học viên không thuộc kỳ thi này hoặc không tồn tại.");
    }

    // Update student: clear active exam info, change status to "Đang học", and pull from exams list
    await Student.updateOne(
      { _id: studentId },
      {
        $set: {
          examId: "",
          examName: "",
          examDate: "",
          status: ["Đang học"],
        },
        $pull: {
          exams: { id: examId }
        }
      }
    );

    // Recalculate exam student count and pass/fail count
    const studentCount = await Student.countDocuments({ examId });
    const passCount = await Student.countDocuments({
      examId,
      exams: {
        $elemMatch: {
          id: examId,
          "result.overall": "Đậu"
        }
      }
    });
    const failCount = await Student.countDocuments({
      examId,
      exams: {
        $elemMatch: {
          id: examId,
          "result.overall": "Trượt"
        }
      }
    });

    exam.studentCount = studentCount;
    exam.passCount = passCount;
    exam.failCount = failCount;
    await exam.save();

    logger.info(`[Exam] Unassigned student successfully. Updated exam stats: studentCount=${studentCount}, passCount=${passCount}, failCount=${failCount}`);
    return { success: true };
  }

  static async updateStudentResult(
    ownerId: string | string[],
    examId: string,
    studentId: string,
    overallResult: "Đậu" | "Trượt" | "Chưa có"
  ): Promise<{ success: boolean }> {
    logger.info(`[Exam] Updating student result: studentId=${studentId}, examId=${examId}, overallResult=${overallResult}`);

    // Check if the exam exists
    const examQuery: Record<string, unknown> = { _id: examId };
    if (ownerId !== "ALL") {
      examQuery.ownerId = Array.isArray(ownerId) ? { $in: ownerId } : ownerId;
    }
    const exam = await Exam.findOne(examQuery);
    if (!exam) {
      logger.warn(`[Exam] Update student result failed - Exam not found: id=${examId}, ownerId=${ownerId}`);
      throw new Error("Kỳ thi không tồn tại.");
    }

    // Find student who matches the studentId and ownerId and has active examId = examId
    const studentQuery: Record<string, unknown> = { _id: studentId, examId };
    if (ownerId !== "ALL") {
      studentQuery.ownerId = Array.isArray(ownerId) ? { $in: ownerId } : ownerId;
    }
    const student = await Student.findOne(studentQuery);
    if (!student) {
      logger.warn(`[Exam] Update student result failed - Student not found or not assigned: studentId=${studentId}, examId=${examId}`);
      throw new Error("Học viên không thuộc kỳ thi này hoặc không tồn tại.");
    }

    // Set student status and exam subdocument details based on the overallResult
    let studentStatus: string[];
    let examStatus: "Sắp thi" | "Đã thi";

    if (overallResult === "Đậu") {
      studentStatus = ["Đã đậu"];
      examStatus = "Đã thi";
    } else if (overallResult === "Trượt") {
      studentStatus = ["Thi lại"];
      examStatus = "Đã thi";
    } else {
      studentStatus = ["Đang thi"];
      examStatus = "Sắp thi";
    }

    // Update student's status and the specific exam's status & result
    await Student.updateOne(
      { _id: studentId, "exams.id": examId },
      {
        $set: {
          status: studentStatus,
          "exams.$.status": examStatus,
          "exams.$.result.overall": overallResult,
        }
      }
    );

    // Recalculate exam stats
    const passCount = await Student.countDocuments({
      examId,
      exams: {
        $elemMatch: {
          id: examId,
          "result.overall": "Đậu"
        }
      }
    });
    const failCount = await Student.countDocuments({
      examId,
      exams: {
        $elemMatch: {
          id: examId,
          "result.overall": "Trượt"
        }
      }
    });

    exam.passCount = passCount;
    exam.failCount = failCount;
    await exam.save();

    logger.info(`[Exam] Updated student result successfully. Exam stats: passCount=${passCount}, failCount=${failCount}`);
    return { success: true };
  }

  static async importResults(
    ownerId: string | string[],
    examId: string,
    results: ImportResultItem[]
  ): Promise<{ success: boolean; successCount: number; failedCount: number; errors: string[] }> {
    logger.info(`[Exam] Importing ${results.length} results for examId=${examId}, ownerId=${ownerId}`);

    // Check if the exam exists
    const examQuery: Record<string, unknown> = { _id: examId };
    if (ownerId !== "ALL") {
      examQuery.ownerId = Array.isArray(ownerId) ? { $in: ownerId } : ownerId;
    }
    const exam = await Exam.findOne(examQuery);
    if (!exam) {
      logger.warn(`[Exam] Import results failed - Exam not found: id=${examId}, ownerId=${ownerId}`);
      throw new Error("Kỳ thi không tồn tại.");
    }

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Loop through results and process each student
    for (const item of results) {
      try {
        const { phone, overallResult, theory = 0, practice = 0, simulation = 0 } = item;

        // Find the student by phone and ownerId, having this examId
        const studentQuery: Record<string, unknown> = { phone, examId };
        if (ownerId !== "ALL") {
          studentQuery.ownerId = Array.isArray(ownerId) ? { $in: ownerId } : ownerId;
        }

        const student = await Student.findOne(studentQuery);
        if (!student) {
          errors.push(`Học viên có SĐT ${phone} không nằm trong kỳ thi này hoặc không tồn tại.`);
          failedCount++;
          continue;
        }

        let studentStatus: string[];
        let examStatus: "Sắp thi" | "Đã thi" = "Sắp thi";

        if (overallResult === "Đậu") {
          studentStatus = ["Đã đậu"];
          examStatus = "Đã thi";
        } else if (overallResult === "Trượt") {
          studentStatus = ["Thi lại"];
          examStatus = "Đã thi";
        } else {
          studentStatus = ["Đang thi"];
          examStatus = "Sắp thi";
        }

        // Update the student and their exam details inside exams array
        await Student.updateOne(
          { _id: student._id, "exams.id": examId },
          {
            $set: {
              status: studentStatus,
              "exams.$.status": examStatus,
              "exams.$.result.theory": theory,
              "exams.$.result.practice": practice,
              "exams.$.result.simulation": simulation,
              "exams.$.result.overall": overallResult,
            }
          }
        );

        successCount++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Lỗi không xác định";
        errors.push(`Lỗi xử lý SĐT ${item.phone}: ${msg}`);
        failedCount++;
      }
    }

    // Recalculate stats for the exam
    const passCount = await Student.countDocuments({
      examId,
      exams: {
        $elemMatch: {
          id: examId,
          "result.overall": "Đậu"
        }
      }
    });
    const failCount = await Student.countDocuments({
      examId,
      exams: {
        $elemMatch: {
          id: examId,
          "result.overall": "Trượt"
        }
      }
    });

    exam.passCount = passCount;
    exam.failCount = failCount;
    await exam.save();

    logger.info(`[Exam] Finished importing results. Success: ${successCount}, Failed: ${failedCount}, passCount=${passCount}, failCount=${failCount}`);

    return {
      success: true,
      successCount,
      failedCount,
      errors
    };
  }
}
