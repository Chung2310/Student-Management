import { Course } from "../models/course.model";
import { ICourse } from "../interfaces/course.interface";
import { logger } from "../config/logger";

interface CourseFilters {
  page?: number | string;
  limit?: number | string;
  category?: string;
  status?: string;
  search?: string;
}

interface CourseData {
  [key: string]: unknown;
}

function buildOwnerQuery(ownerId: string | string[]): Record<string, unknown> {
  if (ownerId === "ALL") return {};
  return { ownerId: Array.isArray(ownerId) ? { $in: ownerId } : ownerId };
}

export class CourseService {
  static async createCourse(ownerId: string, data: CourseData): Promise<ICourse> {
    logger.info(`[Course] Creating course for ownerId=${ownerId}, code=${data.code}`);
    const existing = await Course.findOne({ ownerId, code: String(data.code || "").toUpperCase() });
    if (existing) {
      throw new Error(`Mã khóa học "${data.code}" đã tồn tại.`);
    }
    const course = new Course({ ...data, ownerId });
    const saved = await course.save();
    logger.info(`[Course] Course created: id=${saved._id}, code=${saved.code}`);
    return saved;
  }

  static async getCourses(ownerId: string | string[], filters: CourseFilters) {
    const page = filters.page ? parseInt(String(filters.page)) : 1;
    const limit = filters.limit ? parseInt(String(filters.limit)) : 1000;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = buildOwnerQuery(ownerId);
    if (filters.category) query.category = filters.category;
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: "i" } },
        { code: { $regex: filters.search, $options: "i" } },
      ];
    }

    const total = await Course.countDocuments(query);
    const courses = await Course.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return { courses, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getCourseById(ownerId: string | string[], id: string): Promise<ICourse | null> {
    return await Course.findOne({ _id: id, ...buildOwnerQuery(ownerId) });
  }

  static async updateCourse(ownerId: string | string[], id: string, data: CourseData): Promise<ICourse | null> {
    logger.info(`[Course] Updating course: id=${id}`);
    return await Course.findOneAndUpdate(
      { _id: id, ...buildOwnerQuery(ownerId) },
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  static async deleteCourse(ownerId: string | string[], id: string): Promise<ICourse | null> {
    logger.info(`[Course] Deleting course: id=${id}`);
    return await Course.findOneAndDelete({ _id: id, ...buildOwnerQuery(ownerId) });
  }
}
