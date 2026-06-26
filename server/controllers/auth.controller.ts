import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { AuthRequest } from "../middlewares/auth.middleware";

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const user = await AuthService.register(req.body);
      res.status(201).json({
        success: true,
        data: {
          uid: user._id.toString(),
          email: user.email,
          displayName: user.displayName,
          gasUrl: user.gasUrl,
        },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi không xác định.";
      res.status(400).json({ success: false, error: msg });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { user, accessToken, refreshToken } = await AuthService.login(req.body);
      
      // Set refresh token cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        data: {
          user,
          accessToken,
        },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi không xác định.";
      res.status(400).json({ success: false, error: msg });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const token = req.cookies.refreshToken;
      if (!token) {
        return res.status(401).json({ success: false, error: "Không tìm thấy Refresh Token." });
      }

      const { accessToken, user } = await AuthService.verifyRefreshToken(token);
      res.json({
        success: true,
        data: {
          user,
          accessToken,
        },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Token không hợp lệ.";
      res.status(401).json({ success: false, error: msg });
    }
  }

  static async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie("refreshToken");
      res.json({ success: true, message: "Đăng xuất thành công." });
    } catch (error: unknown) {
      next(error);
    }
  }

  static async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: "Chưa xác thực." });
      }
      const user = await AuthService.getUserProfile(req.user.uid);
      if (!user) {
        return res.status(404).json({ success: false, error: "Không tìm thấy người dùng." });
      }
      res.json({
        success: true,
        data: {
          user: {
            uid: user._id.toString(),
            email: user.email,
            displayName: user.displayName,
            gasUrl: user.gasUrl,
            bankAccountNo: user.bankAccountNo,
            bankId: user.bankId,
            smtpHost: user.smtpHost,
            smtpPort: user.smtpPort,
            smtpSecure: user.smtpSecure,
            smtpUser: user.smtpUser,
            smtpPass: user.smtpPass,
            smtpFrom: user.smtpFrom,
            smtpSandboxEmail: user.smtpSandboxEmail,
          },
        },
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  static async updateBankSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: "Chưa xác thực." });
      }
      const updatedUser = await AuthService.updateBankSettings(req.user.uid, req.body);
      if (!updatedUser) {
        return res.status(404).json({ success: false, error: "Không tìm thấy người dùng." });
      }
      res.json({
        success: true,
        data: {
          user: {
            uid: updatedUser._id.toString(),
            email: updatedUser.email,
            displayName: updatedUser.displayName,
            gasUrl: updatedUser.gasUrl,
            bankAccountNo: updatedUser.bankAccountNo,
            bankId: updatedUser.bankId,
            smtpHost: updatedUser.smtpHost,
            smtpPort: updatedUser.smtpPort,
            smtpSecure: updatedUser.smtpSecure,
            smtpUser: updatedUser.smtpUser,
            smtpPass: updatedUser.smtpPass,
            smtpFrom: updatedUser.smtpFrom,
            smtpSandboxEmail: updatedUser.smtpSandboxEmail,
          },
        },
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  static async updateSmtpSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: "Chưa xác thực." });
      }
      const updatedUser = await AuthService.updateSmtpSettings(req.user.uid, req.body);
      if (!updatedUser) {
        return res.status(404).json({ success: false, error: "Không tìm thấy người dùng." });
      }
      res.json({
        success: true,
        data: {
          user: {
            uid: updatedUser._id.toString(),
            email: updatedUser.email,
            displayName: updatedUser.displayName,
            gasUrl: updatedUser.gasUrl,
            bankAccountNo: updatedUser.bankAccountNo,
            bankId: updatedUser.bankId,
            smtpHost: updatedUser.smtpHost,
            smtpPort: updatedUser.smtpPort,
            smtpSecure: updatedUser.smtpSecure,
            smtpUser: updatedUser.smtpUser,
            smtpPass: updatedUser.smtpPass,
            smtpFrom: updatedUser.smtpFrom,
            smtpSandboxEmail: updatedUser.smtpSandboxEmail,
          },
        },
      });
    } catch (error: unknown) {
      next(error);
    }
  }
}
