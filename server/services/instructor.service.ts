import { Instructor } from "../models/instructor.model";
import { IInstructor } from "../interfaces/instructor.interface";
import { BatchService } from "./batch.service";
import { Batch } from "../models/batch.model";
import { logger } from "../config/logger";

interface InstructorFilters {
  page?: number | string;
  limit?: number | string;
  status?: string;
  search?: string;
}

interface InstructorData {
  [key: string]: unknown;
}

function buildOwnerQuery(ownerId: string | string[]): Record<string, unknown> {
  if (ownerId === "ALL") return {};
  return { ownerId: Array.isArray(ownerId) ? { $in: ownerId } : ownerId };
}

export class InstructorService {
  static async createInstructor(ownerId: string, data: InstructorData): Promise<IInstructor> {
    logger.info(`[Instructor] Creating instructor for ownerId=${ownerId}, name=${data.name}`);
    const instructor = new Instructor({ ...data, ownerId });
    const saved = await instructor.save();
    logger.info(`[Instructor] Instructor created: id=${saved._id}, name=${saved.name}`);
    return saved;
  }

  static async getInstructors(ownerId: string | string[], filters: InstructorFilters) {
    const page = filters.page ? parseInt(String(filters.page)) : 1;
    const limit = filters.limit ? parseInt(String(filters.limit)) : 1000;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = buildOwnerQuery(ownerId);
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { email: { $regex: filters.search, $options: "i" } },
        { phone: { $regex: filters.search, $options: "i" } },
        { specializations: { $elemMatch: { $regex: filters.search, $options: "i" } } },
      ];
    }

    const total = await Instructor.countDocuments(query);
    const instructors = await Instructor.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // activeClasses tính từ số lớp còn hoạt động được gán cho giảng viên
    const activeCounts = await BatchService.countActiveByInstructor(instructors.map(i => String(i._id)));
    const withClasses = instructors.map(i => ({
      ...i.toObject(),
      activeClasses: activeCounts.get(String(i._id)) || 0,
    }));

    return { instructors: withClasses, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getInstructorById(ownerId: string | string[], id: string) {
    const instructor = await Instructor.findOne({ _id: id, ...buildOwnerQuery(ownerId) });
    if (!instructor) return null;
    const activeCounts = await BatchService.countActiveByInstructor([String(instructor._id)]);
    return { ...instructor.toObject(), activeClasses: activeCounts.get(String(instructor._id)) || 0 };
  }

  static async updateInstructor(ownerId: string | string[], id: string, data: InstructorData): Promise<IInstructor | null> {
    logger.info(`[Instructor] Updating instructor: id=${id}`);
    return await Instructor.findOneAndUpdate(
      { _id: id, ...buildOwnerQuery(ownerId) },
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  static async deleteInstructor(ownerId: string | string[], id: string): Promise<IInstructor | null> {
    logger.info(`[Instructor] Deleting instructor: id=${id}`);
    const deleted = await Instructor.findOneAndDelete({ _id: id, ...buildOwnerQuery(ownerId) });
    if (deleted) {
      // Gỡ giảng viên khỏi các lớp đang được gán
      await Batch.updateMany({ instructorId: id }, { $set: { instructorId: "" } });
    }
    return deleted;
  }
}
