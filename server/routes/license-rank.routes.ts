import { Router } from "express";
import { LicenseRankController } from "../controllers/license-rank.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createLicenseRankSchema } from "../validations/license-rank.validation";
import { idParamSchema } from "../validations/student.validation";

const router = Router();

router.use(authMiddleware);

router.get("/", LicenseRankController.getList);
router.post("/", validate(createLicenseRankSchema), LicenseRankController.create);
router.delete("/:id", validate(idParamSchema, "params"), LicenseRankController.delete);

export default router;
