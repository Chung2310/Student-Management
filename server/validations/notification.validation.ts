import Joi from "joi";

export const createNotificationSchema = Joi.object({
  title: Joi.string().required().messages({
    "any.required": "Tiêu đề thông báo là bắt buộc.",
  }),
  content: Joi.string().required().messages({
    "any.required": "Nội dung thông báo là bắt buộc.",
  }),
  recipients: Joi.string().required().messages({
    "any.required": "Người nhận là bắt buộc.",
  }),
  recipientCount: Joi.number().min(0).required(),
  channels: Joi.array().items(Joi.string()).required().messages({
    "any.required": "Kênh gửi thông báo là bắt buộc.",
  }),
  status: Joi.string().valid("Đã gửi", "Đang gửi", "Thất bại").required().messages({
    "any.required": "Trạng thái là bắt buộc.",
  }),
});
