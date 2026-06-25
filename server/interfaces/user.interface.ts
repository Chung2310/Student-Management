import { Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password?: string;
  displayName: string;
  gasUrl?: string;
  bankAccountNo?: string;
  bankId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
