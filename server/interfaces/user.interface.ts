import { Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password?: string;
  displayName: string;
  gasUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
