import { Router } from "express";
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

export default router;
