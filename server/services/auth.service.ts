import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { IUser } from "../interfaces/user.interface";

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
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new Error("Email này đã được sử dụng cho một tài khoản khác.");
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newUser = new User({
      ...data,
      password: hashedPassword,
    });
    return await newUser.save();
  }

  static async login(data: LoginData) {
    const user = await User.findOne({ email: data.email });
    if (!user) {
      throw new Error("Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.");
    }
    const isPasswordValid = await bcrypt.compare(data.password, user.password!);
    if (!isPasswordValid) {
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

    return {
      user: {
        uid: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        gasUrl: user.gasUrl,
      },
      accessToken,
      refreshToken,
    };
  }

  static async verifyRefreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, REFRESH_SECRET) as { uid: string; email: string };
      const user = await User.findById(decoded.uid);
      if (!user) {
        throw new Error("Người dùng không tồn tại.");
      }

      const accessToken = jwt.sign(
        { uid: user._id, email: user.email },
        ACCESS_SECRET,
        { expiresIn: "15m" }
      );

      return {
        accessToken,
        user: {
          uid: user._id.toString(),
          email: user.email,
          displayName: user.displayName,
          gasUrl: user.gasUrl,
        }
      };
    } catch (error) {
      throw new Error("Refresh token không hợp lệ hoặc đã hết hạn.", { cause: error });
    }
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
        console.log(`>>> Seeded admin account successfully: ${adminEmail}`);
      } else {
        console.log(`>>> Admin account already exists: ${adminEmail}`);
      }
    } catch (error) {
      console.error(">>> Error seeding admin account:", error);
    }
  }
}
