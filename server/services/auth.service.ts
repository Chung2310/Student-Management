import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { IUser } from "../interfaces/user.interface";
import { logger } from "../config/logger";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "your_jwt_access_secret_key_should_be_long_and_secure_12345";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your_jwt_refresh_secret_key_should_be_long_and_secure_67890";

interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  gasUrl?: string;
}

interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  static async register(data: RegisterData): Promise<IUser> {
    logger.info(`[Auth] Registration attempt for email: ${data.email}`);
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      logger.warn(`[Auth] Registration failed - Email already exists: ${data.email}`);
      throw new Error("Email này đã được sử dụng cho một tài khoản khác.");
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newUser = new User({
      ...data,
      password: hashedPassword,
    });
    const savedUser = await newUser.save();
    logger.info(`[Auth] User registered successfully: email=${savedUser.email}, uid=${savedUser._id}`);
    return savedUser;
  }

  static async login(data: LoginData) {
    logger.info(`[Auth] Login attempt for email: ${data.email}`);
    const user = await User.findOne({ email: data.email });
    if (!user) {
      logger.warn(`[Auth] Login failed - User not found: ${data.email}`);
      throw new Error("Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.");
    }
    const isPasswordValid = await bcrypt.compare(data.password, user.password!);
    if (!isPasswordValid) {
      logger.warn(`[Auth] Login failed - Invalid password for email: ${data.email}`);
      throw new Error("Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.");
    }

    const accessToken = jwt.sign(
      { uid: user._id, email: user.email },
      ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { uid: user._id, email: user.email },
      REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    logger.info(`[Auth] User logged in successfully: email=${user.email}, uid=${user._id}`);

    return {
      user: {
        uid: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        gasUrl: user.gasUrl,
        bankAccountNo: user.bankAccountNo,
        bankId: user.bankId,
      },
      accessToken,
      refreshToken,
    };
  }

  static async verifyRefreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, REFRESH_SECRET) as { uid: string; email: string };
      logger.info(`[Auth] Verifying refresh token for email: ${decoded.email}`);
      const user = await User.findById(decoded.uid);
      if (!user) {
        logger.warn(`[Auth] Refresh token verification failed - User not found for uid: ${decoded.uid}`);
        throw new Error("Người dùng không tồn tại.");
      }

      const accessToken = jwt.sign(
        { uid: user._id, email: user.email },
        ACCESS_SECRET,
        { expiresIn: "15m" }
      );

      logger.info(`[Auth] Refresh token verified successfully for email: ${user.email}`);

      return {
        accessToken,
        user: {
          uid: user._id.toString(),
          email: user.email,
          displayName: user.displayName,
          gasUrl: user.gasUrl,
          bankAccountNo: user.bankAccountNo,
          bankId: user.bankId,
        }
      };
    } catch (error) {
      logger.error(`[Auth] Refresh token verification failed: ${error instanceof Error ? error.message : error}`);
      throw new Error("Refresh token không hợp lệ hoặc đã hết hạn.", { cause: error });
    }
  }

  static async updateBankSettings(uid: string, data: { bankAccountNo?: string; bankId?: string }): Promise<IUser | null> {
    logger.info(`[Auth] Updating bank settings for uid: ${uid}`);
    return await User.findByIdAndUpdate(
      uid,
      {
        $set: {
          bankAccountNo: data.bankAccountNo || "",
          bankId: data.bankId ? data.bankId.trim().toLowerCase() : "",
        },
      },
      { new: true }
    );
  }

  static async getUserProfile(uid: string): Promise<IUser | null> {
    return await User.findById(uid);
  }

  static async seedAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@studentmanagement.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "AdminPass123";
    const adminDisplayName = process.env.ADMIN_DISPLAY_NAME || "Admin Hệ Thống";

    try {
      const existingUser = await User.findOne({ email: adminEmail });
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const adminUser = new User({
          email: adminEmail,
          password: hashedPassword,
          displayName: adminDisplayName,
        });
        await adminUser.save();
        logger.info(`>>> Seeded admin account successfully: ${adminEmail}`);
      } else {
        logger.info(`>>> Admin account already exists: ${adminEmail}`);
      }
    } catch (error) {
      logger.error(">>> Error seeding admin account:", error);
    }
  }
}
