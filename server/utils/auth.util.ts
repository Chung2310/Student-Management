import { User } from "../models/user.model";

export async function getAllowedOwnerIds(user: { uid: string; role: string; centerId: string }): Promise<string[] | string> {
  if (user.role === "superadmin") {
    return "ALL";
  }
  if (user.role === "admin") {
    // Get all users in the center (including the admin themselves)
    const users = await User.find({ centerId: user.centerId }).select("_id");
    return users.map(u => u._id.toString());
  }
  // Standard user (staff member/employee) can only see their own data
  return user.uid;
}

export async function getCenterOwnerIds(user: { uid: string; role: string; centerId: string }): Promise<string[] | string> {
  if (user.role === "superadmin") {
    return "ALL";
  }

  const users = await User.find({ centerId: user.centerId }).select("_id");
  return users.map((u) => u._id.toString());
}
