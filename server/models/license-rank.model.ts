import { Schema, model } from "mongoose";
import { ILicenseRank } from "../interfaces/license-rank.interface";

const licenseRankSchema = new Schema<ILicenseRank>(
  {
    name: { type: String, required: true, trim: true, index: true },
    ownerId: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate license ranks for the same owner
licenseRankSchema.index({ ownerId: 1, name: 1 }, { unique: true });

export const LicenseRank = model<ILicenseRank>("LicenseRank", licenseRankSchema);
