import { Document } from "mongoose";

export interface ILicenseRank extends Document {
  name: string;
  ownerId: string;
  createdAt?: Date;
  updatedAt?: Date;
}
