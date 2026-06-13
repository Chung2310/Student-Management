import { Router } from "express";
import fs from "fs";
import path from "path";
import authRoutes from "./auth.routes";
import studentRoutes from "./student.routes";
import examRoutes from "./exam.routes";
import paymentRoutes from "./payment.routes";
import notificationRoutes from "./notification.routes";
import uploadRoutes from "./upload.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/students", studentRoutes);
router.use("/exams", examRoutes);
router.use("/payments", paymentRoutes);
router.use("/notifications", notificationRoutes);
router.use("/upload", uploadRoutes);

// Endpoint to log client-side crashes and runtime errors
router.post("/log-client-error", (req, res) => {
  const { error, info } = req.body;
  const logMessage = `[${new Date().toISOString()}] CLIENT ERROR: ${error}\nINFO: ${JSON.stringify(info)}\n\n`;
  try {
    fs.appendFileSync(path.join(process.cwd(), "client_error.log"), logMessage);
  } catch (err) {
    console.error("Ghi log lỗi client thất bại:", err);
  }
  res.json({ success: true });
});

export default router;
