import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { EmailService } from "./server/services/email.service";
import twilio from "twilio";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { logger } from "./server/config/logger";

import { connectDB } from "./server/config/db";
import apiRoutes from "./server/routes/index";
import { swaggerSpec } from "./server/swagger";
import { errorMiddleware } from "./server/middlewares/error.middleware";
import { requestLoggerMiddleware } from "./server/middlewares/logger.middleware";
import { AuthService } from "./server/services/auth.service";
import { sseManager } from "./server/services/sse.manager";

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
        if (!origin || allowedOrigins.indexOf(cleanOrigin) !== -1 || allowedOrigins.includes("*")) {
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
  app.use(requestLoggerMiddleware);

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

  // Server-Sent Events (SSE) Endpoint
  app.get("/api/v1/events", (req, res) => {
    const token = req.query.token as string;
    if (!token) {
      return res.status(401).json({ success: false, error: "Thiếu token xác thực." });
    }

    try {
      const decoded = jwt.verify(
        token, 
        process.env.JWT_ACCESS_SECRET || "your_jwt_access_secret_key_should_be_long_and_secure_12345"
      ) as { uid: string; email: string };
      
      const ownerId = decoded.uid;

      // Thiết lập header cho SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      // Gửi event khởi tạo kết nối
      res.write(`event: connected\ndata: ${JSON.stringify({ message: "Đã kết nối SSE thành công." })}\n\n`);

      // Thêm connection vào SSE Manager
      sseManager.addConnection(ownerId, res);

      // Gửi ping định kỳ mỗi 30 giây để giữ kết nối
      const pingInterval = setInterval(() => {
        res.write(`: ping\n\n`);
      }, 30000);

      req.on("close", () => {
        clearInterval(pingInterval);
        sseManager.removeConnection(ownerId, res);
      });
    } catch (error) {
      logger.error("[SSE] Authentication failed: %o", error);
      return res.status(401).json({ success: false, error: "Token xác thực không hợp lệ hoặc đã hết hạn." });
    }
  });

  // API Route for sending email
  app.post("/api/send-email", async (req, res) => {
    try {
      const { to, subject, html, check } = req.body;

      if (check) {
        const checkResult = await EmailService.verifyConnection();
        if (!checkResult.success) {
          return res.status(400).json({ 
            success: false, 
            error: checkResult.error === "SMTP_CONFIG_missing" 
              ? "Cấu hình SMTP (host, port, user, pass) còn thiếu." 
              : `Lỗi kết nối SMTP: ${checkResult.error}` 
          });
        }
        return res.json({ success: true, status: 'Ready' });
      }

      if (!to || !subject || !html) {
        return res.status(400).json({ success: false, error: 'Thiếu thông tin (to, subject, html)' });
      }

      const result = await EmailService.sendMail({ to, subject, html });

      if (!result.success) {
        if (result.error === "SMTP_CONFIG_missing") {
          return res.status(400).json({
            success: false,
            error: "Hệ thống chưa được cấu hình máy chủ gửi thư SMTP. Vui lòng kiểm tra lại cấu hình."
          });
        }
        return res.status(400).json({ success: false, error: result.error });
      }

      res.json({ success: true, data: { id: result.messageId } });
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
    
    // Serve static files with proper Cache-Control headers
    app.use(express.static(distPath, {
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          // Do not cache HTML files (entry point index.html)
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else if (filePath.includes(path.sep + 'assets' + path.sep) || /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|eot|ttf)$/.test(filePath)) {
          // Cache hashed assets for a long time (immutable)
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));

    app.get('*', (req, res) => {
      // Return 404 for missing static assets instead of serving index.html
      const ext = path.extname(req.path);
      if (ext && ext !== '.html') {
        return res.status(404).send('Asset not found');
      }
      if (req.path.startsWith('/assets/')) {
        return res.status(404).send('Asset not found');
      }

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

