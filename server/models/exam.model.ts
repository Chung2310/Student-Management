import { Schema, model } from "mongoose";
import { IExam } from "../interfaces/exam.interface";

const examSchema = new Schema<IExam>(
  {
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["Sắp diễn ra", "Đã xác nhận", "Đã hoàn thành", "Đã hủy"],
      required: true,
      index: true,
    },
    rank: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C"],
      required: true,
      index: true,
    },
    area: { type: String, required: true },
    tentativeDate: { type: String, required: true },
    officialDate: { type: String, default: "" },
    location: { type: String, required: true },
    studentCount: { type: Number, default: 0 },
    passCount: { type: Number, default: 0 },
    failCount: { type: Number, default: 0 },
    ownerId: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
  }
);

export const Exam = model<IExam>("Exam", examSchema);
