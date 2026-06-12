import { Document } from "mongoose";

export interface INotification extends Document {
  title: string;
  content: string;
  recipients: string;
  recipientCount: number;
  channels: string[];
  status: 'Đã gửi' | 'Đang gửi' | 'Thất bại';
  ownerId: string;
  createdAt?: Date;
  updatedAt?: Date;
}
