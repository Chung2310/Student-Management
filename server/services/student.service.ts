import { Types } from "mongoose";
import { logger } from "../config/logger";
import { IStudent, StudentStatus } from "../interfaces/student.interface";
import { Student, slugify } from "../models/student.model";
import { Payment } from "../models/payment.model";
import { User } from "../models/user.model";
import { Partner } from "../models/partner.model";
import { Batch } from "../models/batch.model";
import { PaymentService } from "./payment.service";

interface StudentFilters {
  page?: number | string;
  limit?: number | string;
  status?: string;
  rank?: string;
  search?: string;
  /** superadmin only: scope data to a specific center (admin uid) */
  ownerFilter?: string;
}

interface StudentCreateData {
  phone: string;
  [key: string]: unknown;
}

interface StudentUpdateData {
  [key: string]: unknown;
}

interface BulkStudentInput {
  fullName?: string;
  phone?: string;
  rank?: string;
  courseId?: string;
  birthday?: string;
  idCard?: string;
  email?: string;
  referral?: string;
  address?: string;
  registrationDate?: string;
  enrollmentDate?: string;
  fee?: string;
  status?: string;
  paidAmount?: string | number;
}

function normalizeIdCard(idCard: string): string {
  return String(idCard || "").replace(/\D/g, "");
}

function normalizeEmail(email: string): string {
  return String(email || "").trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return String(phone || "").replace(/\D/g, "");
}

function normalizeFee(fee: unknown): string {
  const raw = String(fee || "").trim();
  return raw || "0";
}

function buildOwnerScopeQuery(ownerId: string | string[]) {
  if (ownerId === "ALL") {
    return {};
  }

  return {
    ownerId: Array.isArray(ownerId) ? { $in: ownerId } : ownerId,
  };
}

async function ensureUniqueFieldsInScope(
  ownerScope: string | string[],
  data: StudentUpdateData,
  excludeId?: string
) {
  const userId = Array.isArray(ownerScope) ? ownerScope[0] : ownerScope;
  let isDriving = true;
  if (userId) {
    const ownerUser = await User.findById(userId).select("businessType");
    if (ownerUser && ownerUser.businessType !== "driving") {
      isDriving = false;
    }
  }

  const checks: Array<{ field: "email" | "phone" | "idCard"; value: string; message: string }> = [
    {
      field: "email",
      value: normalizeEmail(String(data.email || "")),
      message: "Email này đã tồn tại trong trung tâm hiện tại. Vui lòng kiểm tra lại!",
    },
    {
      field: "phone",
      value: normalizePhone(String(data.phone || "")),
      message: "Số điện thoại này đã tồn tại trong trung tâm hiện tại. Vui lòng kiểm tra lại!",
    },
    {
      field: "idCard",
      value: normalizeIdCard(String(data.idCard || "")),
      message: "CCCD/CMND này đã tồn tại trong trung tâm hiện tại. Vui lòng kiểm tra lại!",
    },
  ];

  for (const check of checks) {
    if (check.field === "idCard" && !isDriving) {
      continue;
    }
    if (!check.value) {
      continue;
    }

    const query: Record<string, unknown> = {
      ...buildOwnerScopeQuery(ownerScope),
      [check.field]: check.value,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await Student.findOne(query).select("_id");
    if (existing) {
      throw new Error(check.message);
    }
  }
}

export class StudentService {
  static async createStudent(ownerId: string, ownerScope: string | string[], data: StudentCreateData): Promise<IStudent> {
    const normalizedPayload = {
      ...data,
      email: typeof data.email === "string" ? normalizeEmail(data.email) : data.email,
      phone: normalizePhone(data.phone),
      idCard: typeof data.idCard === "string" ? normalizeIdCard(data.idCard) : data.idCard,
      fee: normalizeFee(data.fee),
      courseId: typeof data.courseId === "string" ? data.courseId.trim() : data.courseId,
    };

    await ensureUniqueFieldsInScope(ownerScope, normalizedPayload);

    const student = new Student({
      ...normalizedPayload,
      ownerId,
    });
    return await student.save();
  }

  static async getStudents(ownerId: string | string[], filters: StudentFilters) {
    const page = filters.page ? parseInt(String(filters.page)) : 1;
    const limit = filters.limit ? parseInt(String(filters.limit)) : 1000;
    const skip = (page - 1) * limit;

    // superadmin scope override: if ownerFilter provided, resolve to that center's userIds
    let resolvedOwnerId = ownerId;
    if (ownerId === "ALL" && filters.ownerFilter) {
      const centerUsers = await User.find({ centerId: filters.ownerFilter }).select("_id");
      const ids = centerUsers.map(u => u._id.toString());
      // also include the admin themselves
      ids.push(filters.ownerFilter);
      resolvedOwnerId = [...new Set(ids)];
    }

    const query: Record<string, unknown> = {
      ...buildOwnerScopeQuery(resolvedOwnerId),
    };

    if (filters.status) {
      if (typeof filters.status === "string" && filters.status.includes(",")) {
        query.status = { $in: filters.status.split(",") };
      } else {
        query.status = filters.status;
      }
    }
    if (filters.rank) query.rank = filters.rank;
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

  static async getStudentById(ownerId: string | string[], id: string): Promise<IStudent | null> {
    const query: Record<string, unknown> = {
      _id: id,
      ...buildOwnerScopeQuery(ownerId),
    };
    return await Student.findOne(query);
  }

  static async updateStudent(
    ownerId: string | string[],
    ownerScope: string | string[],
    id: string,
    data: StudentUpdateData
  ): Promise<IStudent | null> {
    if (data.fullName) {
      data.slug = slugify(String(data.fullName));
    }
    if (typeof data.idCard === "string") {
      data.idCard = normalizeIdCard(data.idCard);
    }
    if (typeof data.email === "string") {
      data.email = normalizeEmail(data.email);
    }
    if (typeof data.phone === "string") {
      data.phone = normalizePhone(data.phone);
    }
    if (typeof data.fee !== "undefined") {
      data.fee = normalizeFee(data.fee);
    }
    if (typeof data.courseId === "string") {
      data.courseId = data.courseId.trim();
    }

    await ensureUniqueFieldsInScope(ownerScope, data, id);

    const query: Record<string, unknown> = {
      _id: id,
      ...buildOwnerScopeQuery(ownerId),
    };

    if (data.paymentHistory && Array.isArray(data.paymentHistory)) {
      const history = data.paymentHistory as Record<string, unknown>[];
      const amounts = history.map((item) => Number(item?.amount));
      if (amounts.some((amount) => !Number.isSafeInteger(amount) || amount <= 0)) {
        throw new Error("Lịch sử thanh toán có số tiền không hợp lệ.");
      }

      const paidAmount = amounts.reduce((sum, amount) => sum + amount, 0);
      const currentStudent = await Student.findOne(query).select("fee");
      const effectiveFee = typeof data.fee !== "undefined" ? data.fee : currentStudent?.fee;
      const totalFee = parseInt(String(effectiveFee || "0").replace(/\D/g, ""), 10) || 0;
      if (paidAmount > totalFee) {
        throw new Error("Tổng số tiền đã đóng không được vượt quá học phí.");
      }
      data.paidAmount = paidAmount;

      try {
        const oldStudent = await Student.findOne(query);
        if (oldStudent && oldStudent.paymentHistory) {
          const oldHistory = oldStudent.paymentHistory;
          const newHistory = (data.paymentHistory || []) as Record<string, unknown>[];
          const studentOwnerId = oldStudent.ownerId;

          for (const oldItem of oldHistory) {
            const stillExists = newHistory.some((newItem) => String(newItem.id) === String(oldItem.id));
            if (!stillExists) {
              await Payment.deleteOne({ _id: oldItem.id, ownerId: studentOwnerId });
            }
          }

          for (const newItem of newHistory) {
            const oldItem = oldHistory.find((oi) => String(oi.id) === String(newItem.id));
            if (oldItem) {
              const amountChanged = Number(newItem.amount) !== Number(oldItem.amount);
              const dateChanged = String(newItem.date) !== String(oldItem.date);
              const noteChanged = String(newItem.note || "") !== String(oldItem.note || "");

              if (amountChanged || dateChanged || noteChanged) {
                await Payment.updateOne(
                  { _id: newItem.id as string, ownerId: studentOwnerId },
                  {
                    $set: {
                      amount: Number(newItem.amount),
                      date: newItem.date,
                      note: newItem.note,
                    },
                  }
                );
              }
            }
          }
        }
      } catch (err) {
        logger.error(`[Student] Failed to sync paymentHistory changes with Payment collection: %o`, err);
      }
    }

    const updatedStudent = await Student.findOneAndUpdate(
      query,
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!updatedStudent) {
      logger.warn(`[Student] Student update failed/not found: id=${id}, ownerId=${ownerId}`);
    }
    return updatedStudent;
  }

  static async deleteStudent(ownerId: string | string[], id: string): Promise<IStudent | null> {
    const query: Record<string, unknown> = {
      _id: id,
      ...buildOwnerScopeQuery(ownerId),
    };
    const deletedStudent = await Student.findOneAndDelete(query);
    if (!deletedStudent) {
      logger.warn(`[Student] Student delete failed/not found: id=${id}, ownerId=${ownerId}`);
      return null;
    }
    try {
      await Payment.deleteMany({ studentId: id });
      await Batch.updateMany({ learnerIds: id }, { $pull: { learnerIds: id } });
    } catch (err) {
      logger.error(`[Student] Failed to clean up associated records for deleted student: %o`, err);
    }
    return deletedStudent;
  }

  static async bulkDeleteStudents(ownerId: string | string[], ids: string[]): Promise<number> {
    const query: Record<string, unknown> = {
      _id: { $in: ids },
      ...buildOwnerScopeQuery(ownerId),
    };
    const studentsToDelete = await Student.find(query).select("_id");
    const resolvedIds = studentsToDelete.map(s => s._id.toString());
    if (resolvedIds.length === 0) return 0;

    try {
      await Payment.deleteMany({ studentId: { $in: resolvedIds } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await Batch.updateMany({ learnerIds: { $in: resolvedIds } }, { $pull: { learnerIds: { $in: resolvedIds } } } as any);
    } catch (err) {
      logger.error(`[Student] Failed to clean up associated records for bulk deleted students: %o`, err);
    }

    const result = await Student.deleteMany({ _id: { $in: resolvedIds } });
    return result.deletedCount || 0;
  }

  static async bulkCreateStudents(creatorId: string, ownerId: string | string[], studentsData: BulkStudentInput[], targetOwnerId?: string) {
    const creator = await User.findById(creatorId).lean();
    const businessType = creator?.businessType || "driving";

    let importedCount = 0;
    let skippedCount = 0;
    const errors: { row: number; name: string; phone: string; reason: string }[] = [];
    const validStudents: Partial<IStudent>[] = [];

    const seenPhonesInBatch = new Set<string>();

    const query: Record<string, unknown> = {
      ...buildOwnerScopeQuery(ownerId),
    };
    const existingStudents = await Student.find(query).select("phone email idCard");
    const existingPhones = new Set(existingStudents.map((s) => normalizePhone(s.phone)));
    const existingEmails = new Set(existingStudents.map((s) => normalizeEmail(s.email || "")).filter(Boolean));
    const existingIdCards = new Set(existingStudents.map((s) => normalizeIdCard(s.idCard || "")).filter(Boolean));

    for (let i = 0; i < studentsData.length; i++) {
      const rowNum = i + 1;
      const data = studentsData[i];
      const fullName = String(data.fullName || "").trim();
      const phone = normalizePhone(String(data.phone || ""));
      const rank = businessType === "driving"
        ? String(data.rank || "").trim().toUpperCase()
        : String(data.rank || "").trim();
      const courseId = String(data.courseId || "").trim();

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
      if (businessType === "driving" && !["A1", "A2", "B1", "B2", "C"].includes(rank)) {
        errors.push({ row: rowNum, name: fullName, phone, reason: `Hạng bằng '${rank}' không hợp lệ (chỉ nhận A1, A2, B1, B2, C).` });
        skippedCount++;
        continue;
      }

      if (seenPhonesInBatch.has(phone)) {
        errors.push({ row: rowNum, name: fullName, phone, reason: "Số điện thoại bị trùng lặp trong file import." });
        skippedCount++;
        continue;
      }
      seenPhonesInBatch.add(phone);

      if (existingPhones.has(phone)) {
        errors.push({ row: rowNum, name: fullName, phone, reason: "Số điện thoại đã tồn tại trong trung tâm hiện tại." });
        skippedCount++;
        continue;
      }

      const birthday = String(data.birthday || "").trim();
      const idCard = normalizeIdCard(String(data.idCard || ""));
      const email = normalizeEmail(String(data.email || ""));
      const referral = String(data.referral || "").trim();
      const address = String(data.address || "").trim();

      // Lookup partner if referral is provided
      let partnerId = "";
      if (referral) {
        const ownerQuery = buildOwnerScopeQuery(ownerId);
        const partner = await Partner.findOne({
          ...ownerQuery,
          $or: [
            { name: { $regex: new RegExp(`^${referral.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, "i") } },
            { code: { $regex: new RegExp(`^${referral.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, "i") } }
          ]
        }).select("_id");
        if (partner) {
          partnerId = partner._id.toString();
        }
      }
      const fee = String(data.fee || "0").trim();
      const registrationDate = String(data.registrationDate || new Date().toLocaleDateString("vi-VN")).trim();
      const enrollmentDate = String(data.enrollmentDate || "").trim();
      const defaultStatus = businessType === "driving" ? "Chờ KSK" : "Đang học";
      const status = String(data.status || defaultStatus).trim();

      if (email && existingEmails.has(email)) {
        errors.push({ row: rowNum, name: fullName, phone, reason: "Email đã tồn tại trong trung tâm hiện tại." });
        skippedCount++;
        continue;
      }

      if (businessType === "driving" && idCard && existingIdCards.has(idCard)) {
        errors.push({ row: rowNum, name: fullName, phone, reason: "CCCD/CMND đã tồn tại trong trung tâm hiện tại." });
        skippedCount++;
        continue;
      }

      const feeNum = parseInt(fee.replace(/\D/g, ""), 10) || 0;
      const paidAmount = parseInt(String(data.paidAmount || "0").replace(/\D/g, ""), 10) || 0;

      const paymentHistory = [];
      if (paidAmount > 0) {
        paymentHistory.push({
          id: new Types.ObjectId().toString(),
          amount: Math.min(paidAmount, feeNum),
          date: registrationDate,
          method: "Chuyển khoản",
          note: "Nhập từ file Excel",
          recipient: "Hệ thống",
        });
      }

      validStudents.push({
        fullName,
        slug: slugify(fullName),
        phone,
        email: email || undefined,
        referral,
        partnerId,
        birthday,
        idCard,
        rank,
        courseId,
        registrationDate,
        enrollmentDate,
        fee,
        paidAmount: Math.min(paidAmount, feeNum),
        paymentHistory,
        address,
        status: [status as StudentStatus],
        ownerId: targetOwnerId || creatorId,
      });

      existingPhones.add(phone);
      if (email) existingEmails.add(email);
      if (idCard) existingIdCards.add(idCard);
    }

    if (validStudents.length > 0) {
      const results = await Student.insertMany(validStudents);
      importedCount = results.length;
      logger.info(`[Student] Bulk import complete: imported=${importedCount}, skipped=${skippedCount}`);
    } else {
      logger.info(`[Student] Bulk import complete: imported=0, skipped=${skippedCount}`);
    }

    return {
      importedCount,
      skippedCount,
      errors,
    };
  }

  static async markInstallmentPaid(
    ownerId: string | string[],
    studentId: string,
    installmentNo: number
  ): Promise<{ success: boolean; error?: string }> {
    const query: Record<string, unknown> = {
      _id: studentId,
      ...buildOwnerScopeQuery(ownerId),
    };

    const student = await Student.findOne(query);
    if (!student) {
      logger.warn(`[Student] markInstallmentPaid: student not found, id=${studentId}`);
      return { success: false, error: "Không tìm thấy học viên." };
    }

    if (!student.installmentStatus || student.installmentStatus.length === 0) {
      return { success: false, error: "Học viên này chưa có lịch sử đợt thu học phí." };
    }

    type InstallmentEntry = {
      installmentNo: number;
      percent: number;
      amountDue: number;
      status: string;
      sentAt: string;
      paidAt: string;
      notificationId: string;
    };

    const entries = student.installmentStatus as InstallmentEntry[];
    const idx = entries.findIndex((s) => s.installmentNo === installmentNo);

    if (idx < 0) {
      return { success: false, error: `Không tìm thấy đợt ${installmentNo} cho học viên này.` };
    }

    const installment = entries[idx];
    if (installment.status === "Đã thu" && installment.amountDue <= 0) {
      return { success: true };
    }

    const totalFee = parseInt(String(student.fee || "0").replace(/\D/g, ""), 10) || 0;
    const remaining = Math.max(0, totalFee - (student.paidAmount || 0));
    const amount = Math.min(Math.max(0, installment.amountDue || 0), remaining);

    if (amount <= 0) {
      return { success: false, error: "Đợt thu này không còn số tiền cần ghi nhận." };
    }

    const now = new Date();
    const date = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
    await PaymentService.createPayment(ownerId, {
      studentId,
      amount,
      date,
      note: `Thu học phí đợt ${installmentNo}`,
      method: "Chuyển khoản",
      installmentNo,
    });

    return { success: true };
  }

  static async getStudentByIdCard(idCard: string): Promise<IStudent | null> {
    const normalizedIdCard = normalizeIdCard(idCard);
    if (!normalizedIdCard) {
      return null;
    }

    const flexibleDigitPattern = normalizedIdCard
      .split("")
      .map((digit) => `${digit}\\D*`)
      .join("");

    return Student.findOne({
      $or: [
        { idCard: normalizedIdCard },
        { idCard: idCard.trim() },
        { idCard: { $regex: `^\\D*${flexibleDigitPattern}$` } },
      ],
    });
  }
}
