import { Batch } from "../models/batch.model";
import { Course } from "../models/course.model";
import { Instructor } from "../models/instructor.model";
import { Student } from "../models/student.model";
import { IBatch } from "../interfaces/batch.interface";
import { logger } from "../config/logger";

interface BatchFilters {
  page?: number | string;
  limit?: number | string;
  courseId?: string;
  instructorId?: string;
  status?: string;
  search?: string;
}

interface BatchData {
  [key: string]: unknown;
}

/** Batch đã gắn thêm thông tin khóa học / giảng viên để hiển thị */
export interface EnrichedBatch {
  [key: string]: unknown;
  courseCode: string;
  courseTitle: string;
  maxLearners: number;
  instructorName: string;
}

// Lớp còn hoạt động = chưa kết thúc (sắp khai giảng hoặc đang học)
const ACTIVE_STATUSES = ["Sắp khai giảng", "Đang học"];

function buildOwnerQuery(ownerId: string | string[]): Record<string, unknown> {
  if (ownerId === "ALL") return {};
  return { ownerId: Array.isArray(ownerId) ? { $in: ownerId } : ownerId };
}

/** Kiểm tra tính hợp lệ chung của lịch/ngày lớp học */
function assertScheduleValid(data: BatchData) {
  if (data.startTime && data.endTime && String(data.startTime) >= String(data.endTime)) {
    throw new Error("Giờ bắt đầu phải trước giờ kết thúc.");
  }
  if (data.startDate && data.endDate && String(data.startDate) > String(data.endDate)) {
    throw new Error("Ngày khai giảng phải trước hoặc bằng ngày kết thúc.");
  }
}

/** Gắn thông tin khóa học + giảng viên vào danh sách batch */
async function enrichBatches(batches: IBatch[]): Promise<EnrichedBatch[]> {
  const courseIds = [...new Set(batches.map(b => b.courseId).filter(Boolean))];
  const instructorIds = [...new Set(batches.map(b => b.instructorId).filter(Boolean))];

  const [courses, instructors] = await Promise.all([
    Course.find({ _id: { $in: courseIds } }).select("code title maxLearners"),
    Instructor.find({ _id: { $in: instructorIds } }).select("name"),
  ]);

  const courseMap = new Map(courses.map(c => [String(c._id), c]));
  const instructorMap = new Map(instructors.map(i => [String(i._id), i]));

  return batches.map(b => {
    const course = courseMap.get(b.courseId);
    const instructor = b.instructorId ? instructorMap.get(b.instructorId) : undefined;
    return {
      ...b.toObject(),
      courseCode: course?.code || "",
      courseTitle: course?.title || "(Khóa học đã xóa)",
      maxLearners: course?.maxLearners ?? 0,
      instructorName: instructor?.name || "",
    };
  });
}

export class BatchService {
  static async createBatch(ownerId: string, data: BatchData): Promise<EnrichedBatch> {
    logger.info(`[Batch] Creating batch for ownerId=${ownerId}, code=${data.code}`);
    const existing = await Batch.findOne({ ownerId, code: String(data.code || "").toUpperCase() });
    if (existing) {
      throw new Error(`Mã lớp "${data.code}" đã tồn tại.`);
    }
    assertScheduleValid(data);

    const course = await Course.findOne({ _id: data.courseId, ownerId });
    if (!course) {
      throw new Error("Không tìm thấy khóa học của lớp.");
    }
    if (data.instructorId) {
      const instructor = await Instructor.findOne({ _id: data.instructorId, ownerId });
      if (!instructor) {
        throw new Error("Không tìm thấy giảng viên được gán.");
      }
    }

    const batch = new Batch({ ...data, ownerId });
    const saved = await batch.save();
    logger.info(`[Batch] Batch created: id=${saved._id}, code=${saved.code}`);
    return (await enrichBatches([saved]))[0];
  }

  static async getBatches(ownerId: string | string[], filters: BatchFilters) {
    const page = filters.page ? parseInt(String(filters.page)) : 1;
    const limit = filters.limit ? parseInt(String(filters.limit)) : 1000;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = buildOwnerQuery(ownerId);
    if (filters.courseId) query.courseId = filters.courseId;
    if (filters.instructorId) query.instructorId = filters.instructorId;
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      query.$or = [
        { code: { $regex: filters.search, $options: "i" } },
        { location: { $regex: filters.search, $options: "i" } },
      ];
    }

    const total = await Batch.countDocuments(query);
    const batches = await Batch.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return { batches: await enrichBatches(batches), total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getBatchById(ownerId: string | string[], id: string): Promise<EnrichedBatch | null> {
    const batch = await Batch.findOne({ _id: id, ...buildOwnerQuery(ownerId) });
    if (!batch) return null;
    return (await enrichBatches([batch]))[0];
  }

  static async updateBatch(ownerId: string | string[], id: string, data: BatchData): Promise<EnrichedBatch | null> {
    logger.info(`[Batch] Updating batch: id=${id}`);
    const batch = await Batch.findOne({ _id: id, ...buildOwnerQuery(ownerId) });
    if (!batch) return null;

    if (data.code && String(data.code).toUpperCase() !== batch.code) {
      const dup = await Batch.findOne({ ownerId: batch.ownerId, code: String(data.code).toUpperCase() });
      if (dup) {
        throw new Error(`Mã lớp "${data.code}" đã tồn tại.`);
      }
    }
    assertScheduleValid({
      startTime: data.startTime ?? batch.startTime,
      endTime: data.endTime ?? batch.endTime,
      startDate: data.startDate ?? batch.startDate,
      endDate: data.endDate ?? batch.endDate,
    });
    if (data.courseId && data.courseId !== batch.courseId) {
      const course = await Course.findOne({ _id: data.courseId, ownerId: batch.ownerId });
      if (!course) {
        throw new Error("Không tìm thấy khóa học của lớp.");
      }
    }
    if (data.instructorId && data.instructorId !== batch.instructorId) {
      const instructor = await Instructor.findOne({ _id: data.instructorId, ownerId: batch.ownerId });
      if (!instructor) {
        throw new Error("Không tìm thấy giảng viên được gán.");
      }
    }

    batch.set(data);
    const saved = await batch.save();
    return (await enrichBatches([saved]))[0];
  }

  static async deleteBatch(ownerId: string | string[], id: string): Promise<IBatch | null> {
    logger.info(`[Batch] Deleting batch: id=${id}`);
    return await Batch.findOneAndDelete({ _id: id, ...buildOwnerQuery(ownerId) });
  }

  /** Gắn học viên vào lớp (kiểm tra sĩ số tối đa của khóa học) */
  static async addLearner(ownerId: string | string[], id: string, studentId: string): Promise<EnrichedBatch> {
    const batch = await Batch.findOne({ _id: id, ...buildOwnerQuery(ownerId) });
    if (!batch) {
      throw new Error("Không tìm thấy lớp học.");
    }
    if (batch.learnerIds.includes(studentId)) {
      throw new Error("Học viên đã có trong lớp này.");
    }
    const student = await Student.findOne({ _id: studentId, ...buildOwnerQuery(ownerId) });
    if (!student) {
      throw new Error("Không tìm thấy học viên.");
    }
    const course = await Course.findOne({ _id: batch.courseId });
    if (course && course.maxLearners > 0 && batch.learnerIds.length >= course.maxLearners) {
      throw new Error(`Lớp đã đạt sĩ số tối đa (${course.maxLearners} học viên).`);
    }

    batch.learnerIds.push(studentId);
    const saved = await batch.save();
    logger.info(`[Batch] Learner added: batchId=${id}, studentId=${studentId}`);
    return (await enrichBatches([saved]))[0];
  }

  /** Bỏ học viên khỏi lớp */
  static async removeLearner(ownerId: string | string[], id: string, studentId: string): Promise<EnrichedBatch> {
    const batch = await Batch.findOne({ _id: id, ...buildOwnerQuery(ownerId) });
    if (!batch) {
      throw new Error("Không tìm thấy lớp học.");
    }
    const before = batch.learnerIds.length;
    batch.learnerIds = batch.learnerIds.filter(lid => lid !== studentId);
    if (batch.learnerIds.length === before) {
      throw new Error("Học viên không có trong lớp này.");
    }
    const saved = await batch.save();
    logger.info(`[Batch] Learner removed: batchId=${id}, studentId=${studentId}`);
    return (await enrichBatches([saved]))[0];
  }

  /** Đếm số lớp còn hoạt động theo từng khóa học */
  static async countActiveByCourse(courseIds: string[]): Promise<Map<string, number>> {
    if (courseIds.length === 0) return new Map();
    const rows = await Batch.aggregate([
      { $match: { courseId: { $in: courseIds }, status: { $in: ACTIVE_STATUSES } } },
      { $group: { _id: "$courseId", count: { $sum: 1 } } },
    ]);
    return new Map(rows.map((r: { _id: string; count: number }) => [r._id, r.count]));
  }

  /** Đếm số lớp còn hoạt động theo từng giảng viên */
  static async countActiveByInstructor(instructorIds: string[]): Promise<Map<string, number>> {
    if (instructorIds.length === 0) return new Map();
    const rows = await Batch.aggregate([
      { $match: { instructorId: { $in: instructorIds }, status: { $in: ACTIVE_STATUSES } } },
      { $group: { _id: "$instructorId", count: { $sum: 1 } } },
    ]);
    return new Map(rows.map((r: { _id: string; count: number }) => [r._id, r.count]));
  }

  /** Mở rộng lịch học định kỳ của các lớp thành sự kiện theo ngày (phục vụ lịch tổng hợp) */
  static async getClassEventsInRange(ownerId: string | string[], from?: string, to?: string) {
    const batches = await Batch.find(buildOwnerQuery(ownerId));
    const enriched = await enrichBatches(batches);
    const events: { id: string; title: string; date: string; time: string; details: string }[] = [];

    for (const b of enriched) {
      const startDate = String(b.startDate);
      const endDate = String(b.endDate);
      const lower = from && from > startDate ? from : startDate;
      const upper = to && to < endDate ? to : endDate;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(lower) || !/^\d{4}-\d{2}-\d{2}$/.test(upper) || lower > upper) continue;

      const daysOfWeek = (b.daysOfWeek as number[]) || [];
      const learnerCount = Array.isArray(b.learnerIds) ? b.learnerIds.length : 0;
      const detailParts = [
        b.instructorName ? `GV ${b.instructorName}` : "Chưa gán GV",
        `${learnerCount} học viên`,
      ];
      if (b.location) detailParts.push(String(b.location));

      // Duyệt từng ngày trong khoảng, tối đa 400 ngày để tránh phình sự kiện
      const cursor = new Date(`${lower}T00:00:00Z`);
      const end = new Date(`${upper}T00:00:00Z`);
      for (let i = 0; cursor <= end && i < 400; i++, cursor.setUTCDate(cursor.getUTCDate() + 1)) {
        if (!daysOfWeek.includes(cursor.getUTCDay())) continue;
        const date = cursor.toISOString().slice(0, 10);
        events.push({
          id: `${b._id}-${date}`,
          title: `Lớp ${b.code} • ${b.courseTitle}`,
          date,
          time: `${b.startTime} - ${b.endTime}`,
          details: detailParts.join(" • "),
        });
      }
    }
    return events;
  }
}
