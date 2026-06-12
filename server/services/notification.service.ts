import { Notification } from "../models/notification.model";
import { INotification } from "../interfaces/notification.interface";

interface NotificationFilters {
  page?: number | string;
  limit?: number | string;
}

interface NotificationCreateData {
  [key: string]: unknown;
}

export class NotificationService {
  static async createNotification(ownerId: string, data: NotificationCreateData): Promise<INotification> {
    const notification = new Notification({
      ...data,
      ownerId,
    });
    return await notification.save();
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
