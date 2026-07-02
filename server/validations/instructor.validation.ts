import Joi from "joi";

export const createInstructorSchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "Tên giảng viên là bắt buộc.",
    "string.empty": "Tên giảng viên không được để trống.",
  }),
  phone: Joi.string().required().messages({
    "any.required": "Số điện thoại là bắt buộc.",
  }),
  email: Joi.string().email({ tlds: false }).required().messages({
    "any.required": "Email là bắt buộc.",
    "string.email": "Email không hợp lệ.",
  }),
  specializations: Joi.array().items(Joi.string()).min(1).required().messages({
    "any.required": "Chuyên môn là bắt buộc.",
    "array.min": "Cần ít nhất một chuyên môn.",
  }),
  rating: Joi.number().min(0).max(5).optional(),
  activeClasses: Joi.number().min(0).optional(),
  status: Joi.string().valid("Available", "On Leave", "Busy").optional(),
});

export const updateInstructorSchema = Joi.object({
  name: Joi.string().optional(),
  phone: Joi.string().optional(),
  email: Joi.string().email({ tlds: false }).optional(),
  specializations: Joi.array().items(Joi.string()).optional(),
  rating: Joi.number().min(0).max(5).optional(),
  activeClasses: Joi.number().min(0).optional(),
  status: Joi.string().valid("Available", "On Leave", "Busy").optional(),
});
