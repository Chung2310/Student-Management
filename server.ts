import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";
import twilio from "twilio";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import mongoose from "mongoose";

import { connectDB } from "./server/config/db";
import apiRoutes from "./server/routes/index";
import { swaggerSpec } from "./server/swagger";
import { errorMiddleware } from "./server/middlewares/error.middleware";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Connect to MongoDB
  await connectDB();

  const app = express();
  const PORT = 3000;

  // CORS Configuration
  const allowedOrigins = process.env.LINK_COR ? process.env.LINK_COR.split(",") : ["http://localhost:3000"];
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes("*")) {
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
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
      
      const targetEmail = to.trim();

      const { data, error } = await resend.emails.send({
        from: 'He thong <onboarding@resend.dev>',
        to: targetEmail,
        subject: subject.trim(),
        html: html,
      });

      if (error) {
        console.error("Resend API Error:", error);
        if (error.name === 'validation_error') {
          return res.status(400).json({ 
            success: false, 
            error: "Lỗi Validation: Tài khoản Resend Free/Trial chỉ cho phép gửi đến chính email bạn đã đăng ký tài khoản Resend. Vui lòng xác thực tên miền trên Resend để gửi cho học viên khác.",
            details: error
          });
        }
        return res.status(400).json({ success: false, error: error.message || 'Lỗi gửi mail từ phía Resend', details: error });
      }

      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Server email error:", error);
      res.status(500).json({ success: false, error: error.message });
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
    } catch (error: any) {
      console.error("Twilio SMS error:", error);
      res.status(400).json({ success: false, error: error.message });
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

