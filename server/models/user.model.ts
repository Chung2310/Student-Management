import { Schema, model } from "mongoose";
import { IUser } from "../interfaces/user.interface";

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["superadmin", "admin", "user"],
      required: true,
      default: "admin",
      index: true,
    },
    centerId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    createdBy: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    gasUrl: {
      type: String,
      default: "",
    },
    bankAccountNo: {
      type: String,
      default: "",
      trim: true,
    },
    bankId: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    smtpHost: {
      type: String,
      default: "",
      trim: true,
    },
    smtpPort: {
      type: Number,
      default: 587,
    },
    smtpSecure: {
      type: Boolean,
      default: false,
    },
    smtpUser: {
      type: String,
      default: "",
      trim: true,
    },
    smtpPass: {
      type: String,
      default: "",
      trim: true,
    },
    smtpFrom: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    smtpSandboxEmail: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const User = model<IUser>("User", userSchema);
