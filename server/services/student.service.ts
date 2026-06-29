import { Student, slugify } from "../models/student.model";
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
    
    if (data.fullName) {
      data.slug = slugify(String(data.fullName));
    }
    
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async bulkCreateStudents(ownerId: string, studentsData: any[]) {
    logger.info(`[Student] Bulk importing ${studentsData.length} students for ownerId=${ownerId}`);
    
    let importedCount = 0;
    let skippedCount = 0;
    const errors: { row: number; name: string; phone: string; reason: string }[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validStudents: any[] = [];
    
    // Track unique phone numbers within this batch to prevent duplicates inside the file itself
    const seenPhonesInBatch = new Set<string>();

    // Fetch all existing student phone numbers for this ownerId to check in memory
    const existingStudents = await Student.find({ ownerId }).select("phone");
    const existingPhones = new Set(existingStudents.map(s => s.phone));

    for (let i = 0; i < studentsData.length; i++) {
      const rowNum = i + 1;
      const data = studentsData[i];
      const fullName = String(data.fullName || "").trim();
      const phone = String(data.phone || "").trim();
      const rank = String(data.rank || "").trim().toUpperCase();
      const area = String(data.area || "").trim();
      
      // Basic validations
      if (!fullName) {
        errors.push({ row: rowNum, name: fullName, phone, reason: "Họ và tên không được để trống." });
        skippedCount++;
        continue;
      }
      if (!phone) {
        errors.push({ row: rowNum, name: fullName, phone, reason: "Số điện thoại không được để trống." });
        skippedCount++;
        continue;
      }
      if (!["A1", "A2", "B1", "B2", "C"].includes(rank)) {
        errors.push({ row: rowNum, name: fullName, phone, reason: `Hạng bằng '${rank}' không hợp lệ (chỉ nhận A1, A2, B1, B2, C).` });
        skippedCount++;
        continue;
      }
      const validAreas = ["Nội thành", "Ngoại thành", "Tỉnh lân cận"];
      if (!validAreas.includes(area)) {
        errors.push({ row: rowNum, name: fullName, phone, reason: `Khu vực '${area}' không hợp lệ (chỉ nhận Nội thành, Ngoại thành, Tỉnh lân cận).` });
        skippedCount++;
        continue;
      }

      // Check duplicates within batch
      if (seenPhonesInBatch.has(phone)) {
        errors.push({ row: rowNum, name: fullName, phone, reason: "Số điện thoại bị trùng lặp trong file import." });
        skippedCount++;
        continue;
      }
      seenPhonesInBatch.add(phone);

      // Check duplicate in database
      if (existingPhones.has(phone)) {
        errors.push({ row: rowNum, name: fullName, phone, reason: "Số điện thoại đã tồn tại trên hệ thống." });
        skippedCount++;
        continue;
      }

      // Set defaults for optional parameters
      const birthday = String(data.birthday || "").trim();
      const idCard = String(data.idCard || "").trim();
      const email = String(data.email || "").trim().toLowerCase();
      const referral = String(data.referral || "").trim();
      const address = String(data.address || "").trim();
      const fee = String(data.fee || "0").trim();
      const registrationDate = String(data.registrationDate || new Date().toLocaleDateString('vi-VN')).trim();
      const status = String(data.status || "Chờ KSK").trim();

      validStudents.push({
        fullName,
        slug: slugify(fullName),
        phone,
        email: email || undefined,
        referral,
        birthday,
        idCard,
        rank,
        area,
        registrationDate,
        fee,
        paidAmount: 0,
        address,
        status,
        ownerId,
      });
    }

    if (validStudents.length > 0) {
      const results = await Student.insertMany(validStudents);
      importedCount = results.length;
      logger.info(`[Student] Bulk import complete: successfully imported ${importedCount} students, skipped ${skippedCount} students`);
    } else {
      logger.info(`[Student] Bulk import complete: no valid students to import. Skipped ${skippedCount} students`);
    }

    return {
      importedCount,
      skippedCount,
      errors
    };
  }
}
