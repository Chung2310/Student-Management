import { Payment } from "../models/payment.model";
import { Student } from "../models/student.model";
import { IPayment } from "../interfaces/payment.interface";

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
  static async createPayment(ownerId: string, data: PaymentCreateData): Promise<IPayment> {
    const student = await Student.findOne({ _id: data.studentId, ownerId });
    if (!student) {
      throw new Error("Không tìm thấy học viên.");
    }

    const payAmount = parseInt(String(data.amount));
    const totalFee = parseInt(student.fee.replace(/\D/g, ""));
    const paidSoFar = student.paidAmount || 0;
    const remaining = totalFee - paidSoFar;

    if (payAmount > remaining) {
      throw new Error("Số tiền đóng vượt quá số tiền còn nợ. Vui lòng kiểm tra lại!");
    }

    const payment = new Payment({
      ...data,
      ownerId,
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
      method: "Chuyển khoản",
      note: data.note,
      recipient: "Hệ thống",
    });

    await student.save();

    return savedPayment;
  }

  static async getPayments(ownerId: string, filters: PaymentFilters) {
    const page = filters.page ? parseInt(String(filters.page)) : 1;
    const limit = filters.limit ? parseInt(String(filters.limit)) : 1000;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { ownerId };
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

  static async deletePayment(ownerId: string, id: string): Promise<IPayment | null> {
    const payment = await Payment.findOne({ _id: id, ownerId });
    if (!payment) {
      throw new Error("Không tìm thấy giao dịch thanh toán.");
    }

    const student = await Student.findOne({ _id: payment.studentId, ownerId });
    if (student) {
      student.paidAmount = Math.max(0, (student.paidAmount || 0) - payment.amount);
      if (student.paymentHistory) {
        student.paymentHistory = (student.paymentHistory as PaymentHistoryEntry[]).filter(
          (p) => p.id !== payment._id.toString()
        );
      }
      await student.save();
    }

    return await Payment.findOneAndDelete({ _id: id, ownerId });
  }
}
