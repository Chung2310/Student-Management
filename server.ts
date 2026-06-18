import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { Resend } from "resend";
import twilio from "twilio";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import mongoose from "mongoose";
import { logger } from "./server/config/logger";

import { connectDB } from "./server/config/db";
import apiRoutes from "./server/routes/index";
import { swaggerSpec } from "./server/swagger";
import { errorMiddleware } from "./server/middlewares/error.middleware";
import { AuthService } from "./server/services/auth.service";

dotenv.config();


async function startServer() {
  // Connect to MongoDB
  await connectDB();

  // Seed Admin Account
  await AuthService.seedAdmin();

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

  // CORS Configuration
  const allowedOrigins = process.env.LINK_COR 
    ? process.env.LINK_COR.split(",").map(o => o.trim().replace(/\/$/, "")) 
    : ["http://localhost:3000"];
  app.use(
    cors({
      origin: (origin, callback) => {
        const cleanOrigin = origin ? origin.trim().replace(/\/$/, "") : "";
        const isLocalhost = cleanOrigin.startsWith("http://localhost:") || 
                            cleanOrigin.startsWith("http://127.0.0.1:") || 
                            cleanOrigin.startsWith("https://localhost:") || 
                            cleanOrigin.startsWith("https://127.0.0.1:");
        if (!origin || allowedOrigins.indexOf(cleanOrigin) !== -1 || allowedOrigins.includes("*") || isLocalhost) {
          callback(null, true);
        } else {
          callback(new Error("Không được phép bởi CORS"));
        }
      },
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(cookieParser());

  // Swagger Documentation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use("/api-docs", swaggerUi.serve as any, swaggerUi.setup(swaggerSpec) as any);

  // Health Check Endpoint
  app.get("/api/v1/health", (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      res.json({ success: true, status: "OK", database: "Connected" });
    } else {
      res.status(500).json({ success: false, status: "Error", database: "Disconnected" });
    }
  });

  // REST API Route Registration
  app.use("/api/v1", apiRoutes);

  // API Route for sending email
  app.post("/api/send-email", async (req, res) => {
    try {
      const { to, subject, html, check } = req.body;
      const apiKey = process.env.RESEND_API_KEY?.trim();

      if (check) {
        if (!apiKey) {
          return res.status(400).json({ success: false, error: 'RESEND_API_KEY missing' });
        }
        return res.json({ success: true, status: 'Ready' });
      }

      if (!to || !subject || !html) {
        return res.status(400).json({ success: false, error: 'Thiếu thông tin (to, subject, html)' });
      }

      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: "Chưa cấu hình API Key trong Settings -> Secrets."
        });
      }

      const resend = new Resend(apiKey);

      let targetEmail = to.trim();
      const sandboxEmail = process.env.RESEND_SANDBOX_EMAIL?.trim();
      let finalSubject = subject.trim();

      if (sandboxEmail) {
        targetEmail = sandboxEmail;
        finalSubject = `[SANDBOX - Học viên: ${to}] ${finalSubject}`;
      }

      const { data, error } = await resend.emails.send({
        from: 'He thong <onboarding@resend.dev>',
        to: targetEmail,
        subject: finalSubject,
        html: html,
      });

      if (error) {
        logger.error("Resend API Error: %o", error);
        if (error.name === 'validation_error') {
          return res.status(400).json({
            success: false,
            error: "Lỗi Validation: Tài khoản Resend Free/Trial chỉ cho phép gửi đến chính email bạn đã đăng ký tài khoản Resend. Vui lòng xác thực tên miền trên Resend để gửi cho học viên khác, hoặc cấu hình biến môi trường `RESEND_SANDBOX_EMAIL` trong `.env` để chuyển hướng toàn bộ email kiểm thử về email của bạn.",
            details: error
          });
        }
        return res.status(400).json({ success: false, error: error.message || 'Lỗi gửi mail từ phía Resend', details: error });
      }

      res.json({ success: true, data });
    } catch (error: unknown) {
      logger.error("Server email error: %o", error);
      const msg = error instanceof Error ? error.message : 'Lỗi hệ thống';
      res.status(500).json({ success: false, error: msg });
    }
  });

  // API Route for sending SMS (Twilio)
  app.post("/api/send-sms", async (req, res) => {
    try {
      const { to, message, check } = req.body;
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_PHONE_NUMBER;

      if (check) {
        if (!sid || !token || !from) {
          return res.status(400).json({ success: false, error: 'Cấu hình Twilio còn thiếu' });
        }
        return res.json({ success: true, status: 'Ready' });
      }

      if (!to || !message) {
        return res.status(400).json({ success: false, error: 'Thiếu số điện thoại hoặc nội dung' });
      }

      if (!sid || !token || !from) {
        return res.status(400).json({
          success: false,
          error: "Hệ thống chưa được cấu hình Twilio. Vui lòng thêm TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, và TWILIO_PHONE_NUMBER vào Secrets."
        });
      }

      const client = twilio(sid, token);

      // Ensure phone number starts with + and country code
      let formattedTo = to.trim();
      if (formattedTo.startsWith('0')) {
        formattedTo = '+84' + formattedTo.slice(1);
      } else if (!formattedTo.startsWith('+')) {
        formattedTo = '+' + formattedTo;
      }

      const result = await client.messages.create({
        body: message,
        to: formattedTo,
        from: from
      });

      res.json({ success: true, sid: result.sid });
    } catch (error: unknown) {
      logger.error("Twilio SMS error: %o", error);
      const msg = error instanceof Error ? error.message : 'Lỗi hệ thống';
      res.status(400).json({ success: false, error: msg });
    }
  });

  // Global Error Handler Middleware
  app.use(errorMiddleware);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

