import Joi from "joi";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const objectIdSchema = Joi.string().pattern(objectIdPattern).messages({
  "string.pattern.base": "Äá»‹nh dáº¡ng ID khÃ´ng há»£p lá»‡.",
});

export const idParamSchema = Joi.object({
  id: objectIdSchema.required(),
});

const uploadedFileSchema = Joi.object({
  _id: Joi.any().optional(),
  name: Joi.string().required(),
  url: Joi.string().required(),
  type: Joi.string().required(),
  uploadedAt: Joi.any().optional(),
});

export const createStudentSchema = Joi.object({
  fullName: Joi.string().required().messages({
    "any.required": "Há» vÃ  tÃªn lÃ  báº¯t buá»™c.",
    "string.empty": "Há» vÃ  tÃªn khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng.",
  }),
  phone: Joi.string().required().messages({
    "any.required": "Sá»‘ Ä‘iá»‡n thoáº¡i lÃ  báº¯t buá»™c.",
    "string.empty": "Sá»‘ Ä‘iá»‡n thoáº¡i khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng.",
  }),
  email: Joi.string().email().allow("").optional().messages({
    "string.email": "Äá»‹nh dáº¡ng email khÃ´ng há»£p lá»‡.",
  }),
  referral: Joi.string().allow("").optional(),
  birthday: Joi.string().allow("").optional(),
  idCard: Joi.string().allow("").optional(),
  rank: Joi.string().valid("A1", "A2", "B1", "B2", "C").required().messages({
    "any.required": "Háº¡ng báº±ng lÃ  báº¯t buá»™c.",
    "any.only": "Háº¡ng báº±ng khÃ´ng há»£p lá»‡.",
  }),
  registrationDate: Joi.string().required().messages({
    "any.required": "NgÃ y Ä‘Äƒng kÃ½ lÃ  báº¯t buá»™c.",
  }),
  enrollmentDate: Joi.string().allow("").optional(),
  fee: Joi.string().allow("").optional(),
  address: Joi.string().allow("").optional(),
  idCardFront: Joi.string().required().messages({
    "any.required": "Ảnh mặt trước CCCD là bắt buộc.",
    "string.empty": "Ảnh mặt trước CCCD không được để trống.",
  }),
  idCardBack: Joi.string().required().messages({
    "any.required": "Ảnh mặt sau CCCD là bắt buộc.",
    "string.empty": "Ảnh mặt sau CCCD không được để trống.",
  }),
  idCardFrontFile: uploadedFileSchema.optional(),
  idCardBackFile: uploadedFileSchema.optional(),
  portraitFile: uploadedFileSchema.optional(),
  status: Joi.alternatives().try(
    Joi.array().items(Joi.string().valid("Chá»  KSK", "Ä Ã£ KSK", "Ä Ã£ ná»™p HS", "Ä ang há» c", "Ä ang thi", "Ä Ã£ Ä‘áº­u", "Thi láº¡i", "Nghá»‰ há» c", "Ná»£ há» c phÃ­", "Chờ KSK", "Đã KSK", "Đã nộp HS", "Đang học", "Đang thi", "Đã đậu", "Thi lại", "Nghỉ học", "Nợ học phí")),
    Joi.string().valid("Chá»  KSK", "Ä Ã£ KSK", "Ä Ã£ ná»™p HS", "Ä ang há» c", "Ä ang thi", "Ä Ã£ Ä‘áº­u", "Thi láº¡i", "Nghá»‰ há» c", "Ná»£ há» c phÃ­", "Chờ KSK", "Đã KSK", "Đã nộp HS", "Đang học", "Đang thi", "Đã đậu", "Thi lại", "Nghỉ học", "Nợ học phí")
  ).optional(),
});

export const updateStudentSchema = Joi.object({
  fullName: Joi.string().optional(),
  phone: Joi.string().optional(),
  email: Joi.string().email().allow("").optional(),
  referral: Joi.string().allow("").optional(),
  birthday: Joi.string().allow("").optional(),
  idCard: Joi.string().allow("").optional(),
  rank: Joi.string().valid("A1", "A2", "B1", "B2", "C").optional(),
  registrationDate: Joi.string().optional(),
  enrollmentDate: Joi.string().allow("").optional(),
  fee: Joi.string().optional(),
  address: Joi.string().allow("").optional(),
  status: Joi.alternatives().try(
    Joi.array().items(Joi.string().valid("Chá»  KSK", "Ä Ã£ KSK", "Ä Ã£ ná»™p HS", "Ä ang há» c", "Ä ang thi", "Ä Ã£ Ä‘áº­u", "Thi láº¡i", "Nghá»‰ há» c", "Ná»£ há» c phÃ­", "Chờ KSK", "Đã KSK", "Đã nộp HS", "Đang học", "Đang thi", "Đã đậu", "Thi lại", "Nghỉ học", "Nợ học phí")),
    Joi.string().valid("Chá»  KSK", "Ä Ã£ KSK", "Ä Ã£ ná»™p HS", "Ä ang há» c", "Ä ang thi", "Ä Ã£ Ä‘áº­u", "Thi láº¡i", "Nghá»‰ há» c", "Ná»£ há» c phÃ­", "Chờ KSK", "Đã KSK", "Đã nộp HS", "Đang học", "Đang thi", "Đã đậu", "Thi lại", "Nghỉ học", "Nợ học phí")
  ).optional(),
  healthCheckDate: Joi.string().allow("").optional(),
  healthCheckNotes: Joi.string().allow("").optional(),
  healthCheckFiles: Joi.array().items(uploadedFileSchema).optional(),
  idCardFrontFile: uploadedFileSchema.allow(null).optional(),
  idCardBackFile: uploadedFileSchema.allow(null).optional(),
  portraitFile: uploadedFileSchema.allow(null).optional(),
  progress: Joi.object({
    theory: Joi.object({
      completed: Joi.boolean().optional(),
      score: Joi.any().optional(),
      lastDate: Joi.string().allow("").optional(),
    }).optional(),
    practice: Joi.object({
      hoursDone: Joi.number().optional(),
      totalHours: Joi.number().optional(),
    }).optional(),
    cabin: Joi.object({
      hoursDone: Joi.number().optional(),
      totalHours: Joi.number().optional(),
    }).optional(),
    dat: Joi.object({
      kmDone: Joi.number().optional(),
      totalKm: Joi.number().optional(),
    }).optional(),
    sim: Joi.object({
      completed: Joi.boolean().optional(),
      lastDate: Joi.string().allow("").optional(),
    }).optional(),
  }).optional(),
  exams: Joi.array().optional(),
  paymentHistory: Joi.array().optional(),
  examId: Joi.string().allow("").optional(),
  examName: Joi.string().allow("").optional(),
  examDate: Joi.string().allow("").optional(),
  idCardFront: Joi.string().allow("").optional(),
  idCardBack: Joi.string().allow("").optional(),
});

export const publicRegisterStudentSchema = Joi.object({
  fullName: Joi.string().required().messages({
    "any.required": "Há» vÃ  tÃªn lÃ  báº¯t buá»™c.",
    "string.empty": "Há» vÃ  tÃªn khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng.",
  }),
  phone: Joi.string().required().messages({
    "any.required": "Sá»‘ Ä‘iá»‡n thoáº¡i lÃ  báº¯t buá»™c.",
    "string.empty": "Sá»‘ Ä‘iá»‡n thoáº¡i khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng.",
  }),
  email: Joi.string().email().required().messages({
    "any.required": "Email lÃ  báº¯t buá»™c.",
    "string.empty": "Email khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng.",
    "string.email": "Äá»‹nh dáº¡ng email khÃ´ng há»£p lá»‡.",
  }),
  birthday: Joi.string().required().messages({
    "any.required": "NgÃ y sinh lÃ  báº¯t buá»™c.",
    "string.empty": "NgÃ y sinh khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng.",
  }),
  idCard: Joi.string().required().messages({
    "any.required": "Sá»‘ CCCD/CMND lÃ  báº¯t buá»™c.",
    "string.empty": "Sá»‘ CCCD/CMND khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng.",
  }),
  rank: Joi.string().valid("A1", "A2", "B1", "B2", "C").required().messages({
    "any.required": "Háº¡ng báº±ng lÃ  báº¯t buá»™c.",
    "any.only": "Háº¡ng báº±ng khÃ´ng há»£p lá»‡.",
  }),
  enrollmentDate: Joi.string().required().messages({
    "any.required": "NgÃ y nháº­p há» c lÃ  báº¯t buá»™c.",
    "string.empty": "NgÃ y nháº­p há» c khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng.",
  }),
  address: Joi.string().required().messages({
    "any.required": "Ä á»‹a chá»‰ lÃ  báº¯t buá»™c.",
    "string.empty": "Ä á»‹a chá»‰ khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng.",
  }),
  idCardFrontFile: uploadedFileSchema.required().messages({
    "any.required": "áº¢nh CCCD máº·t trÆ°á»›c lÃ  báº¯t buá»™c.",
  }),
  idCardBackFile: uploadedFileSchema.required().messages({
    "any.required": "áº¢nh CCCD máº·t sau lÃ  báº¯t buá»™c.",
  }),
  portraitFile: uploadedFileSchema.required().messages({
    "any.required": "áº¢nh chÃ¢n dung lÃ  báº¯t buá»™c.",
  }),
  teacherId: objectIdSchema.required().messages({
    "any.required": "ID giÃ¡o viÃªn lÃ  báº¯t buá»™c.",
    "string.empty": "ID giÃ¡o viÃªn khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng.",
  }),
});
