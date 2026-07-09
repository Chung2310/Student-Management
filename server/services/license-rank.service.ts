import { LicenseRank } from "../models/license-rank.model";
import { ILicenseRank } from "../interfaces/license-rank.interface";
import { User } from "../models/user.model";
import { logger } from "../config/logger";

const DEFAULT_RANKS = ["A1", "A2", "B1", "B2", "C", "D", "E", "FB2", "FC", "FD", "FE"];

export class LicenseRankService {
  static async getRanks(ownerId: string | string[], filters: { ownerFilter?: string } = {}): Promise<ILicenseRank[]> {
    logger.info(`[LicenseRankService] Fetching ranks for ownerId: ${ownerId}, ownerFilter: ${filters.ownerFilter}`);

    let resolvedOwnerId = ownerId;
    if (ownerId === "ALL" && filters.ownerFilter) {
      const centerUsers = await User.find({ centerId: filters.ownerFilter }).select("_id");
      const ids = centerUsers.map(u => u._id.toString());
      ids.push(filters.ownerFilter);
      resolvedOwnerId = [...new Set(ids)];
    }

    let query: Record<string, unknown> = {};
    if (resolvedOwnerId !== "ALL") {
      query = { ownerId: Array.isArray(resolvedOwnerId) ? { $in: resolvedOwnerId } : resolvedOwnerId };
    }

    let ranks = await LicenseRank.find(query).sort({ createdAt: 1 });

    // Seed defaults ONLY if resolvedOwnerId is a single owner string and ranks are empty
    if (ranks.length === 0 && typeof resolvedOwnerId === "string" && resolvedOwnerId !== "ALL") {
      logger.info(`[LicenseRankService] Seeding default ranks for ownerId: ${resolvedOwnerId}`);
      const seedData = DEFAULT_RANKS.map(name => ({ ownerId: resolvedOwnerId, name }));
      await LicenseRank.insertMany(seedData);
      ranks = await LicenseRank.find(query).sort({ createdAt: 1 });
    }

    return ranks;
  }

  static async createRank(ownerId: string, name: string): Promise<ILicenseRank> {
    const trimmedName = name.trim().toUpperCase();
    logger.info(`[LicenseRankService] Creating rank "${trimmedName}" for ownerId: ${ownerId}`);

    const existing = await LicenseRank.findOne({ ownerId, name: { $regex: `^${trimmedName}$`, $options: "i" } });
    if (existing) {
      throw new Error(`Hạng bằng "${trimmedName}" đã tồn tại.`);
    }

    const rank = new LicenseRank({ name: trimmedName, ownerId });
    return await rank.save();
  }

  static async deleteRank(ownerId: string | string[], id: string): Promise<ILicenseRank | null> {
    logger.info(`[LicenseRankService] Deleting rank with id: ${id}`);

    let query: Record<string, unknown> = {};
    if (ownerId !== "ALL") {
      query = { ownerId: Array.isArray(ownerId) ? { $in: ownerId } : ownerId };
    }

    const rank = await LicenseRank.findOne({ _id: id, ...query });
    if (!rank) {
      return null;
    }

    return await LicenseRank.findOneAndDelete({ _id: id });
  }
}
