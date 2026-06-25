import Joi from "joi";

export const webhookPaymentSchema = Joi.object({
  // SePay flat fields
  transferAmount: Joi.number().optional(),
  content: Joi.string().allow("").optional(),
  accountNumber: Joi.any().optional(), // Có thể là string hoặc number
  transactionDate: Joi.string().allow("").optional(),
  
  // Casso flat fields
  amount: Joi.number().optional(),
  description: Joi.string().allow("").optional(),
  subAccount: Joi.any().optional(), // Có thể là string hoặc number
  when: Joi.string().allow("").optional(),

  // Other metadata fields
  id: Joi.any().optional(),
  gateway: Joi.string().allow("").optional(),
  transferType: Joi.string().allow("").optional(),
  accumulatedBalance: Joi.number().optional(),
  code: Joi.string().allow("").optional(),
  referenceCode: Joi.string().allow("").optional(),
  cusName: Joi.string().allow("").optional(),
  bankName: Joi.string().allow("").optional(),
  
  // Casso wrapper format
  error: Joi.number().optional(),
  messages: Joi.string().optional(),
  data: Joi.array().items(Joi.object({
    id: Joi.any().optional(),
    tid: Joi.string().allow("").optional(),
    when: Joi.string().allow("").optional(),
    amount: Joi.number().required().messages({
      "any.required": "Trường amount là bắt buộc trong data.",
    }),
    description: Joi.string().allow("").required().messages({
      "any.required": "Trường description là bắt buộc trong data.",
    }),
    cusName: Joi.string().allow("").optional(),
    subAccount: Joi.any().required().messages({
      "any.required": "Trường subAccount là bắt buộc trong data.",
    }),
    bankName: Joi.string().allow("").optional(),
  })).optional(),
}).unknown(true); // Cho phép các fields không xác định từ API bên thứ ba
