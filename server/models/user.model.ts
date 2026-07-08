import { Schema, model } from "mongoose";
import { IUser } from "../interfaces/user.interface";

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
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
    bankAccountName: {
      type: String,
      default: "",
      trim: true,
    },
    bankQrEnabled: {
      type: Boolean,
      default: true,
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
    businessType: {
      type: String,
      enum: ["driving", "language", "general"],
      default: "driving",
      required: true,
    },
    smtpSandboxEmail: {
      type: String,
      default: "",
      trim: true,
    },
    maxUsersLimit: {
      type: Number,
      default: 10,
    },
    permissions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("validate", function () {
  if (this.role === "admin" && (!this.centerId || this.centerId === "undefined")) {
    this.centerId = this._id.toString();
  }
  if (this.role === "superadmin" && this.centerId !== "superadmin") {
    this.centerId = "superadmin";
  }
});

userSchema.index({ email: 1, centerId: 1 }, { unique: true });

export const User = model<IUser>("User", userSchema);
