import { Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password?: string;
  displayName: string;
  gasUrl?: string;
  bankAccountNo?: string;
  bankId?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
  smtpSandboxEmail?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
