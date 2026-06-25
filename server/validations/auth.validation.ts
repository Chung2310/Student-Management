import Joi from "joi";

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Định dạng email không hợp lệ.",
    "any.required": "Email là bắt buộc.",
    "string.empty": "Email không được để trống.",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Mật khẩu phải từ 6 ký tự trở lên.",
    "any.required": "Mật khẩu là bắt buộc.",
    "string.empty": "Mật khẩu không được để trống.",
  }),
  displayName: Joi.string().required().messages({
    "any.required": "Tên hiển thị là bắt buộc.",
    "string.empty": "Tên hiển thị không được để trống.",
  }),
  gasUrl: Joi.string().uri().allow("").optional().messages({
    "string.uri": "GAS URL phải ở dạng đường dẫn hợp lệ.",
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Định dạng email không hợp lệ.",
    "any.required": "Email là bắt buộc.",
    "string.empty": "Email không được để trống.",
  }),
  password: Joi.string().required().messages({
    "any.required": "Mật khẩu là bắt buộc.",
    "string.empty": "Mật khẩu không được để trống.",
  }),
});

export const bankSettingsSchema = Joi.object({
  bankAccountNo: Joi.string().allow("").optional().messages({
    "string.base": "Số tài khoản không hợp lệ.",
  }),
  bankId: Joi.string().allow("").optional().messages({
    "string.base": "Mã ngân hàng không hợp lệ.",
  }),
});
