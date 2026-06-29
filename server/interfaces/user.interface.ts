import { Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password?: string;
  displayName: string;
  role: "superadmin" | "admin" | "user";
  centerId: string;
  createdBy?: string;
  bankAccountNo?: string;
  bankId?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
  smtpSandboxEmail?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
