import Joi from "joi";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const objectIdSchema = Joi.string().pattern(objectIdPattern).messages({
  "string.pattern.base": "Định dạng ID không hợp lệ.",
});

export const idParamSchema = Joi.object({
  id: objectIdSchema.required(),
});

export const createStudentSchema = Joi.object({
  fullName: Joi.string().required().messages({
    "any.required": "Họ và tên là bắt buộc.",
    "string.empty": "Họ và tên không được để trống.",
  }),
  phone: Joi.string().required().messages({
    "any.required": "Số điện thoại là bắt buộc.",
    "string.empty": "Số điện thoại không được để trống.",
  }),
  email: Joi.string().email().allow("").optional().messages({
    "string.email": "Định dạng email không hợp lệ.",
  }),
  referral: Joi.string().allow("").optional(),
  birthday: Joi.string().allow("").optional(),
  idCard: Joi.string().allow("").optional(),
  rank: Joi.string().valid("A1", "A2", "B1", "B2", "C").required().messages({
    "any.required": "Hạng bằng là bắt buộc.",
    "any.only": "Hạng bằng không hợp lệ.",
  }),
  area: Joi.string().valid("Nội thành", "Ngoại thành", "Tỉnh lân cận").required().messages({
    "any.required": "Khu vực là bắt buộc.",
    "any.only": "Khu vực không hợp lệ.",
  }),
  registrationDate: Joi.string().required().messages({
    "any.required": "Ngày đăng ký là bắt buộc.",
  }),
  fee: Joi.string().required().messages({
    "any.required": "Học phí là bắt buộc.",
  }),
  address: Joi.string().allow("").optional(),
  status: Joi.string().valid('Chờ KSK', 'Đã KSK', 'Đã nộp HS', 'Đang học', 'Đang thi', 'Đã đậu', 'Thi lại', 'Nghỉ học', 'Nợ học phí').optional(),
});

export const updateStudentSchema = Joi.object({
  fullName: Joi.string().optional(),
  phone: Joi.string().optional(),
  email: Joi.string().email().allow("").optional(),
  referral: Joi.string().allow("").optional(),
  birthday: Joi.string().allow("").optional(),
  idCard: Joi.string().allow("").optional(),
  rank: Joi.string().valid("A1", "A2", "B1", "B2", "C").optional(),
  area: Joi.string().valid("Nội thành", "Ngoại thành", "Tỉnh lân cận").optional(),
  fee: Joi.string().optional(),
  address: Joi.string().allow("").optional(),
  status: Joi.string().valid('Chờ KSK', 'Đã KSK', 'Đã nộp HS', 'Đang học', 'Đang thi', 'Đã đậu', 'Thi lại', 'Nghỉ học', 'Nợ học phí').optional(),
  healthCheckDate: Joi.string().allow("").optional(),
  healthCheckNotes: Joi.string().allow("").optional(),
  healthCheckFiles: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      url: Joi.string().required(),
      type: Joi.string().required(),
      uploadedAt: Joi.any().optional(),
    })
  ).optional(),
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
});

export const publicRegisterStudentSchema = Joi.object({
  fullName: Joi.string().required().messages({
    "any.required": "Họ và tên là bắt buộc.",
    "string.empty": "Họ và tên không được để trống.",
  }),
  phone: Joi.string().required().messages({
    "any.required": "Số điện thoại là bắt buộc.",
    "string.empty": "Số điện thoại không được để trống.",
  }),
  email: Joi.string().email().allow("").optional().messages({
    "string.email": "Định dạng email không hợp lệ.",
  }),
  birthday: Joi.string().allow("").optional(),
  idCard: Joi.string().allow("").optional(),
  rank: Joi.string().valid("A1", "A2", "B1", "B2", "C").required().messages({
    "any.required": "Hạng bằng là bắt buộc.",
    "any.only": "Hạng bằng không hợp lệ.",
  }),
  area: Joi.string().valid("Nội thành", "Ngoại thành", "Tỉnh lân cận").required().messages({
    "any.required": "Khu vực là bắt buộc.",
    "any.only": "Khu vực không hợp lệ.",
  }),
  address: Joi.string().allow("").optional(),
  teacherId: objectIdSchema.required().messages({
    "any.required": "ID giáo viên là bắt buộc.",
    "string.empty": "ID giáo viên không được để trống.",
  }),
});
