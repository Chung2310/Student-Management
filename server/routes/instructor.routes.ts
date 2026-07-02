import { Router } from "express";
import { InstructorController } from "../controllers/instructor.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createInstructorSchema, updateInstructorSchema } from "../validations/instructor.validation";
import { idParamSchema } from "../validations/student.validation";

const router = Router();

router.use(authMiddleware);

router.post("/", validate(createInstructorSchema), InstructorController.create);
router.get("/", InstructorController.getList);
router.get("/:id", validate(idParamSchema, "params"), InstructorController.getDetail);
router.patch("/:id", validate(idParamSchema, "params"), validate(updateInstructorSchema), InstructorController.update);
router.delete("/:id", validate(idParamSchema, "params"), InstructorController.delete);

export default router;
