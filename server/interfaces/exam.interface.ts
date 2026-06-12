import { Document } from "mongoose";

export type ExamStatus = 'Sắp diễn ra' | 'Đã xác nhận' | 'Đã hoàn thành' | 'Đã hủy';

export interface IExam extends Document {
  name: string;
  status: ExamStatus;
  rank: 'A1' | 'A2' | 'B1' | 'B2' | 'C';
  area: string;
  tentativeDate: string;
  officialDate?: string;
  location: string;
  studentCount: number;
  passCount: number;
  failCount: number;
  ownerId: string;
  createdAt?: Date;
  updatedAt?: Date;
}
