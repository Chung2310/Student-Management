import { Notification } from "../models/notification.model";
import { Student } from "../models/student.model";
import { INotification } from "../interfaces/notification.interface";
import { IInstallmentPlan } from "../interfaces/installment.interface";

function buildOwnerScopeQuery(ownerScope: string | string[]): Record<string, unknown> {
  if (ownerScope === "ALL") return {};
  return { ownerId: Array.isArray(ownerScope) ? { $in: ownerScope } : ownerScope };
}

interface NotificationFilters {
  page?: number | string;
  limit?: number | string;
}

interface NotificationCreateData {
  title: string;
  content: string;
  recipients: string;
  recipientCount: number;
  channels: string[];
  status: 'Đã gửi' | 'Đang gửi' | 'Thất bại';
  installmentPlan?: IInstallmentPlan;
  // studentIds dùng để cập nhật installmentStatus (không lưu trong Notification doc)
  studentIds?: string[];
  [key: string]: unknown;
}

export class NotificationService {
  static async createNotification(
    ownerId: string,
    data: NotificationCreateData,
    studentOwnerScope: string | string[] = ownerId
  ): Promise<INotification> {
    const { studentIds, ...notificationData } = data;

    const notification = new Notification({
      ...notificationData,
      ownerId,
    });
    const savedNotification = await notification.save();

    // Cập nhật installmentStatus cho từng học viên nếu có installmentPlan và danh sách studentIds
    if (data.installmentPlan && Array.isArray(studentIds) && studentIds.length > 0) {
      const { installmentNo, percent } = data.installmentPlan;
      const label = data.installmentPlan.label || `Đợt ${installmentNo}`;
      const sentAt = new Date().toISOString();
      const notificationId = savedNotification._id.toString();

      // Xử lý tuần tự để tránh race condition
      for (const studentId of studentIds) {
        try {
          // Security: only allow mutating students within the caller's own center/owner scope
          // (prevents a caller from passing arbitrary/foreign studentIds to modify another
          // tenant's installmentStatus data).
          const student = await Student.findOne({
            _id: studentId,
            ...buildOwnerScopeQuery(studentOwnerScope),
          });
          if (!student) continue;

          // Tính số tiền đợt này = % × tổng học phí gốc
          const totalFee = parseInt(student.fee.replace(/\D/g, "")) || 0;
          const amountDue = Math.round(totalFee * percent / 100);

          if (!student.installmentStatus) {
            student.installmentStatus = [];
          }

          // Upsert: nếu đã có installmentNo này → cập nhật, chưa có → push mới
          const existingIndex = (student.installmentStatus as Array<{ installmentNo: number; percent: number; amountDue: number; status: string; sentAt: string; paidAt: string; notificationId: string }>)
            .findIndex((s) => s.installmentNo === installmentNo);

          if (existingIndex >= 0) {
            (student.installmentStatus as Array<{ installmentNo: number; percent: number; amountDue: number; status: string; sentAt: string; paidAt: string; notificationId: string }>)[existingIndex] = {
              installmentNo,
              percent,
              amountDue,
              status: 'Đã gửi',
              sentAt,
              paidAt: '',
              notificationId,
            };
          } else {
            (student.installmentStatus as Array<{ installmentNo: number; percent: number; amountDue: number; status: string; sentAt: string; paidAt: string; notificationId: string }>).push({
              installmentNo,
              percent,
              amountDue,
              status: 'Đã gửi',
              sentAt,
              paidAt: '',
              notificationId,
            });
          }

          student.markModified('installmentStatus');
          await student.save();
        } catch {
          // Bỏ qua lỗi cập nhật từng student, không làm hỏng cả batch
        }
      }

      void label; // dùng để tránh lint unused
    }

    return savedNotification;
  }

  static async getNotifications(ownerId: string, filters: NotificationFilters) {
    const page = filters.page ? parseInt(String(filters.page)) : 1;
    const limit = filters.limit ? parseInt(String(filters.limit)) : 1000;
    const skip = (page - 1) * limit;

    const query = { ownerId };

    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async deleteNotification(ownerId: string, id: string): Promise<INotification | null> {
    return await Notification.findOneAndDelete({ _id: id, ownerId });
  }
}

