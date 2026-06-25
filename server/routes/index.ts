import { Router } from "express";
import fs from "fs";
import path from "path";
import authRoutes from "./auth.routes";
import studentRoutes from "./student.routes";
import examRoutes from "./exam.routes";
import paymentRoutes from "./payment.routes";
import notificationRoutes from "./notification.routes";
import uploadRoutes from "./upload.routes";
import aiRoutes from "./ai.routes";
import chatbotRoutes from "./chatbot.routes";
import webhookRoutes from "./webhook.routes";
import { logger } from "../config/logger";

const router = Router();

router.use("/auth", authRoutes);
router.use("/students", studentRoutes);
router.use("/exams", examRoutes);
router.use("/payments", paymentRoutes);
router.use("/notifications", notificationRoutes);
router.use("/upload", uploadRoutes);
router.use("/ai", aiRoutes);
router.use("/chatbot", chatbotRoutes);
router.use("/webhook", webhookRoutes);


// Endpoint to log client-side crashes and runtime errors
router.post("/log-client-error", (req, res) => {
  const { error, info } = req.body;
  const logMessage = `[${new Date().toISOString()}] CLIENT ERROR: ${error}\nINFO: ${JSON.stringify(info)}\n\n`;
  try {
    fs.appendFileSync(path.join(process.cwd(), "client_error.log"), logMessage);
    logger.error(`Client crash reported: ${error} - Info: ${JSON.stringify(info)}`);
  } catch (err) {
    logger.error("Ghi log lỗi client thất bại: %o", err);
  }
  res.json({ success: true });
});

export default router;
