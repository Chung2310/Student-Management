import Joi from "joi";
import { objectIdSchema } from "./student.validation";

export const createExamSchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "Tên kỳ thi là bắt buộc.",
    "string.empty": "Tên kỳ thi không được để trống.",
  }),
  status: Joi.string().valid("Sắp diễn ra", "Đã xác nhận", "Đã hoàn thành", "Đã hủy").required().messages({
    "any.required": "Trạng thái kỳ thi là bắt buộc.",
  }),
  rank: Joi.string().valid("A1", "A2", "B1", "B2", "C").required().messages({
    "any.required": "Hạng bằng là bắt buộc.",
  }),
  area: Joi.string().required().messages({
    "any.required": "Khu vực là bắt buộc.",
  }),
  tentativeDate: Joi.string().required().messages({
    "any.required": "Ngày dự kiến thi là bắt buộc.",
  }),
  officialDate: Joi.string().allow("").optional(),
  location: Joi.string().required().messages({
    "any.required": "Địa điểm thi là bắt buộc.",
  }),
  studentCount: Joi.number().optional(),
  passCount: Joi.number().optional(),
  failCount: Joi.number().optional(),
});

export const updateExamSchema = Joi.object({
  name: Joi.string().optional(),
  status: Joi.string().valid("Sắp diễn ra", "Đã xác nhận", "Đã hoàn thành", "Đã hủy").optional(),
  rank: Joi.string().valid("A1", "A2", "B1", "B2", "C").optional(),
  area: Joi.string().optional(),
  tentativeDate: Joi.string().optional(),
  officialDate: Joi.string().allow("").optional(),
  location: Joi.string().optional(),
  studentCount: Joi.number().optional(),
  passCount: Joi.number().optional(),
  failCount: Joi.number().optional(),
});

export const assignStudentSchema = Joi.object({
  studentId: objectIdSchema.optional(),
  studentIds: Joi.array().items(objectIdSchema).optional(),
  examId: Joi.string().allow("").optional(),
  examName: Joi.string().allow("").optional(),
  examDate: Joi.string().allow("").optional(),
}).or("studentId", "studentIds");
