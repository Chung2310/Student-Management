import Joi from "joi";

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Dinh dang email khong hop le.",
    "any.required": "Email la bat buoc.",
    "string.empty": "Email khong duoc de trong.",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Mat khau phai tu 6 ky tu tro len.",
    "any.required": "Mat khau la bat buoc.",
    "string.empty": "Mat khau khong duoc de trong.",
  }),
  displayName: Joi.string().required().messages({
    "any.required": "Ten hien thi la bat buoc.",
    "string.empty": "Ten hien thi khong duoc de trong.",
  }),
  gasUrl: Joi.string().uri().allow("").optional().messages({
    "string.uri": "GAS URL phai o dang duong dan hop le.",
  }),
});

export const createManagedUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  displayName: Joi.string().required(),
  role: Joi.string().valid("admin", "user").required(),
  centerId: Joi.string().allow("").optional(),
  gasUrl: Joi.string().uri().allow("").optional(),
  bankAccountNo: Joi.string().allow("").optional(),
  bankId: Joi.string().allow("").optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Dinh dang email khong hop le.",
    "any.required": "Email la bat buoc.",
    "string.empty": "Email khong duoc de trong.",
  }),
  password: Joi.string().required().messages({
    "any.required": "Mat khau la bat buoc.",
    "string.empty": "Mat khau khong duoc de trong.",
  }),
});

export const bankSettingsSchema = Joi.object({
  bankAccountNo: Joi.string().allow("").optional().messages({
    "string.base": "So tai khoan khong hop le.",
  }),
  bankId: Joi.string().allow("").optional().messages({
    "string.base": "Ma ngan hang khong hop le.",
  }),
});

export const smtpSettingsSchema = Joi.object({
  smtpHost: Joi.string().allow("").optional(),
  smtpPort: Joi.number().integer().allow(null, "").optional(),
  smtpSecure: Joi.boolean().allow(null, "").optional(),
  smtpUser: Joi.string().allow("").optional(),
  smtpPass: Joi.string().allow("").optional(),
  smtpFrom: Joi.string().allow("").optional(),
  smtpSandboxEmail: Joi.string().email().allow("").optional().messages({
    "string.email": "Dinh dang email sandbox khong hop le.",
  }),
});

export const smsSettingsSchema = Joi.object({
  provider: Joi.string().valid("twilio", "stringee", "tingting").optional(),
  twilioAccountSid: Joi.string().allow("").optional(),
  twilioAuthToken: Joi.string().allow("").optional(),
  twilioFromNumber: Joi.string().allow("").optional(),
  twilioMessagingServiceSid: Joi.string().allow("").optional(),
  twilioStatusCallbackUrl: Joi.string().uri().allow("").optional().messages({
    "string.uri": "Dinh dang URL callback Twilio khong hop le.",
  }),
  stringeeApiUrl: Joi.string().uri().allow("").optional().messages({
    "string.uri": "Dinh dang URL API Stringee khong hop le.",
  }),
  stringeeApiKey: Joi.string().allow("").optional(),
  stringeeSecretKey: Joi.string().allow("").optional(),
  stringeeBrandname: Joi.string().allow("").optional(),
  stringeeSender: Joi.string().allow("").optional(),
  stringeeStatusCallbackUrl: Joi.string().uri().allow("").optional().messages({
    "string.uri": "Dinh dang URL callback Stringee khong hop le.",
  }),
  tingtingApiKey: Joi.string().allow("").optional(),
  tingtingSender: Joi.string().allow("").optional(),
});
