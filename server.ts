import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import twilio from "twilio";
import { logger } from "./server/config/logger";

import { connectDB } from "./server/config/db";
import apiRoutes from "./server/routes/index";
import { swaggerSpec } from "./server/swagger";
import { errorMiddleware } from "./server/middlewares/error.middleware";
import { requestLoggerMiddleware } from "./server/middlewares/logger.middleware";
import { AuthService } from "./server/services/auth.service";
import { sseManager } from "./server/services/sse.manager";

dotenv.config();

function formatVietnamPhoneNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("84")) {
    return digits;
  }
  if (digits.startsWith("0")) {
    return `84${digits.slice(1)}`;
  }
  return digits;
}

function formatPhoneToE164(phone: string) {
  const normalized = formatVietnamPhoneNumber(phone);
  return normalized.startsWith("+") ? normalized : `+${normalized}`;
}

async function sendSmsViaTwilio(to: string, message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER?.trim();
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
  const statusCallbackUrl = process.env.TWILIO_STATUS_CALLBACK_URL?.trim();

  if (!accountSid || !authToken) {
    throw new Error("Cau hinh Twilio con thieu. Vui long them TWILIO_ACCOUNT_SID va TWILIO_AUTH_TOKEN.");
  }

  if (!fromNumber && !messagingServiceSid) {
    throw new Error("Can cau hinh TWILIO_FROM_NUMBER hoac TWILIO_MESSAGING_SERVICE_SID.");
  }

  const client = twilio(accountSid, authToken);
  const toPhone = formatPhoneToE164(to);

  logger.info(
    `[Twilio] Sending SMS ${JSON.stringify({
      to: toPhone,
      hasFromNumber: Boolean(fromNumber),
      hasMessagingServiceSid: Boolean(messagingServiceSid),
      contentLength: message.length,
    })}`
  );

  const result = await client.messages.create({
    to: toPhone,
    body: message,
    ...(statusCallbackUrl ? { statusCallback: statusCallbackUrl } : {}),
    ...(messagingServiceSid ? { messagingServiceSid } : { from: fromNumber }),
  });

  logger.info(
    `[Twilio] Response received ${JSON.stringify({
      sid: result.sid,
      status: result.status,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
      to: result.to,
    })}`
  );

  return {
    sid: result.sid,
    status: result.status,
    errorCode: result.errorCode,
    errorMessage: result.errorMessage,
    normalizedPhone: toPhone,
    provider: "twilio",
  };
}

async function startServer() {
  await connectDB();
  await AuthService.seedAdmin();

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

  const allowedOrigins = process.env.LINK_COR
    ? process.env.LINK_COR.split(",").map((o) => o.trim().replace(/\/$/, ""))
    : ["http://localhost:3000"];

  app.use(
    cors({
      origin: (origin, callback) => {
        const cleanOrigin = origin ? origin.trim().replace(/\/$/, "") : "";
        if (!origin || allowedOrigins.indexOf(cleanOrigin) !== -1 || allowedOrigins.includes("*")) {
          callback(null, true);
        } else {
          callback(new Error("Khong duoc phep boi CORS"));
        }
      },
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(requestLoggerMiddleware);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use("/api-docs", swaggerUi.serve as any, swaggerUi.setup(swaggerSpec) as any);

  app.get("/api/v1/health", (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      res.json({ success: true, status: "OK", database: "Connected" });
    } else {
      res.status(500).json({ success: false, status: "Error", database: "Disconnected" });
    }
  });

  app.use("/api/v1", apiRoutes);

  app.get("/api/v1/events", (req, res) => {
    const token = req.query.token as string;
    if (!token) {
      return res.status(401).json({ success: false, error: "Thieu token xac thuc." });
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET || "your_jwt_access_secret_key_should_be_long_and_secure_12345"
      ) as { uid: string; email: string };

      const ownerId = decoded.uid;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      res.write(`event: connected\ndata: ${JSON.stringify({ message: "Da ket noi SSE thanh cong." })}\n\n`);

      sseManager.addConnection(ownerId, res);

      const pingInterval = setInterval(() => {
        res.write(": ping\n\n");
      }, 30000);

      req.on("close", () => {
        clearInterval(pingInterval);
        sseManager.removeConnection(ownerId, res);
      });
    } catch (error) {
      logger.error("[SSE] Authentication failed: %o", error);
      return res.status(401).json({ success: false, error: "Token xac thuc khong hop le hoac da het han." });
    }
  });

  app.post("/api/send-sms", async (req, res) => {
    try {
      const { to, message, check } = req.body;
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_FROM_NUMBER?.trim();
      const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();

      if (check) {
        if (!accountSid || !authToken || (!fromNumber && !messagingServiceSid)) {
          return res.status(400).json({ success: false, error: "Cau hinh Twilio con thieu" });
        }
        return res.json({
          success: true,
          status: "Ready",
          provider: "twilio",
          fromNumber: fromNumber || null,
          messagingServiceSid: messagingServiceSid || null,
        });
      }

      if (!to || !message) {
        return res.status(400).json({ success: false, error: "Thieu so dien thoai hoac noi dung" });
      }

      if (!accountSid || !authToken || (!fromNumber && !messagingServiceSid)) {
        return res.status(400).json({
          success: false,
          error: "He thong chua duoc cau hinh Twilio. Vui long them TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN va TWILIO_FROM_NUMBER hoac TWILIO_MESSAGING_SERVICE_SID vao file moi truong.",
        });
      }

      const result = await sendSmsViaTwilio(to, message);
      res.json({
        success: true,
        provider: result.provider,
        smsId: result.sid,
        status: result.status,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
        normalizedPhone: result.normalizedPhone,
        message: "Yeu cau da gui toi Twilio thanh cong.",
      });
    } catch (error: unknown) {
      logger.error("Twilio error: %o", error);
      const msg = error instanceof Error ? error.message : "Loi he thong";
      res.status(400).json({ success: false, error: msg });
    }
  });

  app.post("/api/twilio/status", (req, res) => {
    const payload = {
      messageSid: req.body.MessageSid,
      messageStatus: req.body.MessageStatus,
      smsStatus: req.body.SmsStatus,
      to: req.body.To,
      from: req.body.From,
      errorCode: req.body.ErrorCode,
      errorMessage: req.body.ErrorMessage,
      accountSid: req.body.AccountSid,
    };

    logger.info(`[Twilio] Status callback ${JSON.stringify(payload)}`);
    res.status(204).send();
  });

  app.use(errorMiddleware);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");

    app.use(
      express.static(distPath, {
        maxAge: "1d",
        setHeaders: (res, filePath) => {
          if (filePath.endsWith(".html")) {
            res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Expires", "0");
          } else if (
            filePath.includes(path.sep + "assets" + path.sep) ||
            /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|eot|ttf)$/.test(filePath)
          ) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          }
        },
      })
    );

    app.get("*", (req, res) => {
      const ext = path.extname(req.path);
      if (ext && ext !== ".html") {
        return res.status(404).send("Asset not found");
      }
      if (req.path.startsWith("/assets/")) {
        return res.status(404).send("Asset not found");
      }

      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
