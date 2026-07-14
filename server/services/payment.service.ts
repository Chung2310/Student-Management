import { Payment } from "../models/payment.model";
import { Student } from "../models/student.model";
import { IPayment } from "../interfaces/payment.interface";
import { logger } from "../config/logger";

interface PaymentFilters {
  page?: number | string;
  limit?: number | string;
  studentId?: string;
}

interface PaymentCreateData {
  studentId: string;
  amount: number | string;
  date: string;
  note?: string;
  method?: string;
  [key: string]: unknown;
}

interface PaymentHistoryEntry {
  id: string;
  amount: number;
  date: string;
  method: "Tiền mặt" | "Chuyển khoản";
  note?: string;
  recipient: string;
}

export class PaymentService {
  static async createPayment(ownerId: string | string[], data: PaymentCreateData): Promise<IPayment> {
    const studentQuery: Record<string, unknown> = { _id: data.studentId };
    if (ownerId !== "ALL") {
      studentQuery.ownerId = Array.isArray(ownerId) ? { $in: ownerId } : ownerId;
    }
    const student = await Student.findOne(studentQuery);
    if (!student) {
      logger.warn(`[Payment] Create payment failed - Student ${data.studentId} not found for ownerId=${ownerId}`);
      throw new Error("Không tìm thấy học viên.");
    }

    const payAmount = Number(data.amount);
    const totalFee = parseInt(String(student.fee || "0").replace(/\D/g, ""), 10) || 0;
    const paidSoFar = student.paidAmount || 0;
    const remaining = Math.max(0, totalFee - paidSoFar);

    if (!Number.isSafeInteger(payAmount) || payAmount <= 0) {
      throw new Error("Số tiền thanh toán không hợp lệ.");
    }

    if (payAmount > remaining) {
      logger.warn(`[Payment] Create payment failed - Amount ${payAmount} exceeds remaining debt ${remaining} for student ${data.studentId}`);
      throw new Error("Số tiền đóng vượt quá số tiền còn nợ. Vui lòng kiểm tra lại!");
    }

    // Set ownerId of the payment record to the student's actual ownerId to maintain consistency
    const payment = new Payment({
      ...data,
      studentName: student.fullName,
      ownerId: student.ownerId,
    });
    const savedPayment = await payment.save();

    // Update student paidAmount and append to paymentHistory array
    student.paidAmount = (student.paidAmount || 0) + payAmount;
    
    if (!student.paymentHistory) {
      student.paymentHistory = [];
    }
    student.paymentHistory.push({
      id: savedPayment._id.toString(),
      amount: payAmount,
      date: data.date,
      method: data.method === "Tiền mặt" ? "Tiền mặt" : "Chuyển khoản",
      note: data.note,
      recipient: "Hệ thống",
    });

    // Tự động phân bổ số tiền thanh toán vào các đợt đóng học phí (installmentStatus) nếu có
    if (student.installmentStatus && student.installmentStatus.length > 0) {
      let allocated = payAmount;
      const requestedInstallmentNo = Number(data.installmentNo);

      // Chiến lược 1: Khớp chính xác số tiền đợt chưa thu (ưu tiên quét QR)
      const exactMatch = student.installmentStatus.find(
        (inst) => Number.isInteger(requestedInstallmentNo)
          ? inst.installmentNo === requestedInstallmentNo
          : inst.status !== 'Đã thu' && Math.abs(inst.amountDue - allocated) <= 1000
      );

      if (exactMatch) {
        exactMatch.status = 'Đã thu';
        exactMatch.amountDue = 0;
        exactMatch.paidAt = new Date().toISOString();
      } else {
        // Chiến lược 2: Phân bổ tuần tự (FIFO)
        const unpaidInstallments = student.installmentStatus
          .filter((inst) => inst.status !== 'Đã thu')
          .sort((a, b) => a.installmentNo - b.installmentNo);

        for (const inst of unpaidInstallments) {
          if (allocated <= 0) break;
          if (allocated >= inst.amountDue) {
            allocated -= inst.amountDue;
            inst.amountDue = 0;
            inst.status = 'Đã thu';
            inst.paidAt = new Date().toISOString();
          } else {
            inst.amountDue -= allocated;
            allocated = 0;
          }
        }
      }
      student.markModified('installmentStatus');
    }

    try {
      await student.save();
    } catch (error) {
      await Payment.deleteOne({ _id: savedPayment._id });
      throw error;
    }

    return savedPayment;
  }

  static async getPayments(ownerId: string | string[], filters: PaymentFilters) {
    const page = filters.page ? parseInt(String(filters.page)) : 1;
    const limit = filters.limit ? parseInt(String(filters.limit)) : 1000;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (ownerId !== "ALL") {
      query.ownerId = Array.isArray(ownerId) ? { $in: ownerId } : ownerId;
    }
    if (filters.studentId) query.studentId = filters.studentId;

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async deletePayment(ownerId: string | string[], id: string): Promise<IPayment | null> {
    const paymentQuery: Record<string, unknown> = { _id: id };
    if (ownerId !== "ALL") {
      paymentQuery.ownerId = Array.isArray(ownerId) ? { $in: ownerId } : ownerId;
    }
    const payment = await Payment.findOne(paymentQuery);
    if (!payment) {
      logger.warn(`[Payment] Delete payment failed - Payment not found: id=${id}, ownerId=${ownerId}`);
      throw new Error("Không tìm thấy giao dịch thanh toán.");
    }

    const studentQuery: Record<string, unknown> = { _id: payment.studentId };
    if (ownerId !== "ALL") {
      studentQuery.ownerId = Array.isArray(ownerId) ? { $in: ownerId } : ownerId;
    }
    const student = await Student.findOne(studentQuery);
    if (student) {
      student.paidAmount = Math.max(0, (student.paidAmount || 0) - payment.amount);
      if (student.paymentHistory) {
        student.paymentHistory = (student.paymentHistory as PaymentHistoryEntry[]).filter(
          (p) => p.id !== payment._id.toString()
        );
      }
      await student.save();
    }

    const deleted = await Payment.findOneAndDelete(paymentQuery);
    return deleted;
  }
}
