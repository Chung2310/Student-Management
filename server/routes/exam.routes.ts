import { Router } from "express";
import { ExamController } from "../controllers/exam.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createExamSchema, updateExamSchema, assignStudentSchema } from "../validations/exam.validation";
import { idParamSchema } from "../validations/student.validation";

const router = Router();

router.use(authMiddleware);

router.post("/", validate(createExamSchema), ExamController.create);
router.get("/", ExamController.getList);
router.get("/:id", validate(idParamSchema, "params"), ExamController.getDetail);
router.patch("/:id", validate(idParamSchema, "params"), validate(updateExamSchema), ExamController.update);
router.delete("/:id", validate(idParamSchema, "params"), ExamController.delete);
router.post("/:id/assign", validate(idParamSchema, "params"), validate(assignStudentSchema), ExamController.assign);

export default router;
