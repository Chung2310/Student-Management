import { CourseCategory } from "../models/course-category.model";
import { ICourseCategory } from "../interfaces/course-category.interface";
import { Course } from "../models/course.model";
import { User } from "../models/user.model";
import { logger } from "../config/logger";

export class CourseCategoryService {
  static async getCategories(ownerId: string | string[], filters: { ownerFilter?: string } = {}): Promise<ICourseCategory[]> {
    logger.info(`[CourseCategory] Fetching categories for ownerId: ${ownerId}, ownerFilter: ${filters.ownerFilter}`);
    
    let resolvedOwnerId = ownerId;
    if (ownerId === "ALL" && filters.ownerFilter) {
      const centerUsers = await User.find({ centerId: filters.ownerFilter }).select("_id");
      const ids = centerUsers.map(u => u._id.toString());
      ids.push(filters.ownerFilter);
      resolvedOwnerId = [...new Set(ids)];
    }

    let query: Record<string, unknown> = {};
    if (resolvedOwnerId !== "ALL") {
      query = { ownerId: Array.isArray(resolvedOwnerId) ? { $in: resolvedOwnerId } : resolvedOwnerId };
    }

    return await CourseCategory.find(query).sort({ createdAt: 1 });
  }

  static async createCategory(ownerId: string, name: string): Promise<ICourseCategory> {
    const trimmedName = name.trim();
    logger.info(`[CourseCategory] Creating category "${trimmedName}" for ownerId: ${ownerId}`);

    const existing = await CourseCategory.findOne({ ownerId, name: { $regex: `^${trimmedName}$`, $options: "i" } });
    if (existing) {
      throw new Error(`Phân loại "${trimmedName}" đã tồn tại.`);
    }

    const category = new CourseCategory({ name: trimmedName, ownerId });
    return await category.save();
  }

  static async deleteCategory(ownerId: string | string[], id: string): Promise<ICourseCategory | null> {
    logger.info(`[CourseCategory] Deleting category with id: ${id}`);
    
    let query: Record<string, unknown> = {};
    if (ownerId !== "ALL") {
      query = { ownerId: Array.isArray(ownerId) ? { $in: ownerId } : ownerId };
    }

    const category = await CourseCategory.findOne({ _id: id, ...query });
    if (!category) {
      return null;
    }

    // Kiểm tra xem phân loại này có đang được khoá học nào sử dụng không
    const coursesInUse = await Course.findOne({ 
      ...query,
      category: category.name 
    });

    if (coursesInUse) {
      throw new Error(`Không thể xóa phân loại "${category.name}" vì đang có khóa học sử dụng.`);
    }

    return await CourseCategory.findOneAndDelete({ _id: id });
  }
}
