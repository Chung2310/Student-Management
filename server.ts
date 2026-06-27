import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
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
import { authMiddleware, AuthRequest } from "./server/middlewares/auth.middleware";
import { AuthService } from "./server/services/auth.service";
import { SmsSettingsService } from "./server/services/sms-settings.service";
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

type SmsSendResult = {
  provider: "tingting";
  smsId: string | null;
  codeResult: string | null;
  errorMessage: string | null;
  normalizedPhone: string;
};

async function sendSmsViaTingtingWithConfig(params: {
  to: string;
  message: string;
  apikey?: string;
  sender?: string;
}): Promise<SmsSendResult> {
  const { to, message, apikey, sender = "" } = params;

  if (!apikey) {
    throw new Error("Cau hinh TingTing con thieu. Vui long them TINGTING_API_KEY.");
  }

  const normalizedPhone = formatVietnamPhoneNumber(to);

  logger.info(
    `[TingTing] Sending SMS ${JSON.stringify({
      to: normalizedPhone,
      sender,
      contentLength: message.length,
    })}`
  );

  const payload = {
    to: normalizedPhone,
    content: message,
    sender: sender,
  };

  const response = await fetch("https://v1.tingting.im/api/sms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": apikey,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json() as {
    status?: string;
    message?: string;
    count?: number;
    cost?: number;
    transaction_id?: string;
  };

  logger.info(
    `[TingTing] Response received ${JSON.stringify({
      httpStatus: response.status,
      status: data.status,
      message: data.message,
      transaction_id: data.transaction_id,
    })}`
  );

  if (!response.ok) {
    throw new Error(data.message || "Khong the ket noi TingTing.");
  }

  if (data.status !== "success") {
    throw new Error(data.message || `TingTing gui tin nhan that bai.`);
  }

  return {
    provider: "tingting" as const,
    smsId: data.transaction_id || null,
    codeResult: data.status || null,
    errorMessage: data.message || null,
    normalizedPhone,
  };
}

async function getTenantSmsConfig(ownerId: string) {
  const settings = await SmsSettingsService.getByOwnerId(ownerId);
  if (!settings) {
    return null;
  }

  return {
    provider: settings.provider,
    tingtingApiKey: settings.tingtingApiKey,
    tingtingSender: settings.tingtingSender,
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

  app.post("/api/send-sms", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { to, message, check } = req.body;
      const ownerId = req.user?.uid;
      const tenantConfig = ownerId ? await getTenantSmsConfig(ownerId) : null;
      
      const useTenant = tenantConfig?.provider === "tingting" && tenantConfig.tingtingApiKey;
      
      const provider = "tingting";
      const apikey = useTenant ? tenantConfig.tingtingApiKey : process.env.TINGTING_API_KEY;
      const sender = useTenant 
        ? (tenantConfig.tingtingSender?.trim() || "") 
        : (process.env.TINGTING_SENDER?.trim() || "");

      if (check) {
        if (!apikey) {
          return res.status(400).json({ success: false, error: "Cau hinh TingTing con thieu" });
        }
        return res.json({
          success: true,
          status: "Ready",
          provider,
          source: useTenant ? "tenant" : "env",
        });
      }

      if (!to || !message) {
        return res.status(400).json({ success: false, error: "Thieu so dien thoai hoac noi dung" });
      }

      if (!apikey) {
        return res.status(400).json({
          success: false,
          error: "He thong chua duoc cau hinh TingTing. Vui long them TINGTING_API_KEY vao file moi truong.",
        });
      }

      const result = await sendSmsViaTingtingWithConfig({
        to,
        message,
        apikey,
        sender,
      });
      res.json({
        success: true,
        provider: result.provider,
        source: useTenant ? "tenant" : "env",
        smsId: result.smsId,
        codeResult: result.codeResult,
        errorMessage: result.errorMessage,
        normalizedPhone: result.normalizedPhone,
        message: "Yeu cau da gui toi TingTing thanh cong.",
      });
    } catch (error: unknown) {
      logger.error("TingTing error: %o", error);
      const msg = error instanceof Error ? error.message : "Loi he thong";
      res.status(400).json({ success: false, error: msg });
    }
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
