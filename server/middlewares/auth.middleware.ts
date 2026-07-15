import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ACCESS_SECRET } from "../config/jwt-secrets";

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: "superadmin" | "admin" | "user";
    centerId: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Không tìm thấy token xác thực." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as {
      uid: string;
      email: string;
      role: "superadmin" | "admin" | "user";
      centerId: string;
    };
    req.user = decoded;
    next();
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, error: "Token đã hết hạn.", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ success: false, error: "Token không hợp lệ." });
  }
}
export function requireRoles(...roles: Array<"superadmin" | "admin" | "user">) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Chua xac thuc." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: "Ban khong co quyen truy cap." });
    }

    next();
  };
}
