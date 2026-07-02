import { Schema, model } from "mongoose";
import { IInstructor } from "../interfaces/instructor.interface";

const instructorSchema = new Schema<IInstructor>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    specializations: { type: [String], default: [] },
    rating: { type: Number, default: 5, min: 0, max: 5 },
    activeClasses: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Available", "On Leave", "Busy"],
      default: "Available",
      index: true,
    },
    ownerId: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
  }
);

export const Instructor = model<IInstructor>("Instructor", instructorSchema);
