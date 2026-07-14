import Joi from "joi";
import { STUDENT_STATUSES } from "../interfaces/student.interface";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

function isValidDate(value: string): boolean {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return false;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

const dateSchema = Joi.string().custom((value, helpers) => (
  isValidDate(value) ? value : helpers.error("date.invalid")
)).messages({
  "date.invalid": "Ngày không hợp lệ hoặc không đúng định dạng DD/MM/YYYY.",
});

const birthdaySchema = dateSchema.custom((value, helpers) => {
  const [day, month, year] = value.split("/").map(Number);
  const birthday = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return birthday < today ? value : helpers.error("date.past");
}).messages({
  "date.past": "Ngày sinh phải là một ngày trong quá khứ.",
});

export const objectIdSchema = Joi.string().pattern(objectIdPattern).messages({
  "string.pattern.base": "Định dạng ID không hợp lệ.",
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
    "any.required": "Họ và tên là bắt buộc.",
    "string.empty": "Họ và tên không được để trống.",
  }),
  phone: Joi.string().required().pattern(/^(0[35789]\d{8})$/).messages({
    "any.required": "Số điện thoại là bắt buộc.",
    "string.empty": "Số điện thoại không được để trống.",
    "string.pattern.base": "Số điện thoại không hợp lệ (phải gồm 10 chữ số bắt đầu bằng 03, 05, 07, 08 hoặc 09).",
  }),
  email: Joi.string().email().allow("").optional().messages({
    "string.email": "Định dạng email không hợp lệ.",
  }),
  referral: Joi.string().allow("").optional(),
  birthday: birthdaySchema.allow("").optional(),
  idCard: Joi.string().pattern(/^(\d{9}|\d{12})$/).allow("").optional().messages({
    "string.pattern.base": "Số CCCD/CMND phải có 9 hoặc 12 chữ số.",
  }),
  rank: Joi.string().allow("").optional(),
  courseId: objectIdSchema.allow("").optional(),
  registrationDate: Joi.string().required().messages({
    "any.required": "Ngày đăng ký là bắt buộc.",
  }),
  enrollmentDate: dateSchema.allow("").optional(),
  fee: Joi.string().allow("").optional(),
  address: Joi.string().allow("").optional(),
  idCardFront: Joi.string().allow("").optional(),
  idCardBack: Joi.string().allow("").optional(),
  idCardFrontFile: uploadedFileSchema.optional(),
  idCardBackFile: uploadedFileSchema.optional(),
  vneidIdCardFile: uploadedFileSchema.optional(),
  portraitFile: uploadedFileSchema.optional(),
  status: Joi.alternatives().try(
    Joi.array().items(Joi.string().valid(...STUDENT_STATUSES)),
    Joi.string().valid(...STUDENT_STATUSES)
  ).optional(),
  centerId: Joi.string().allow("").optional(),
  partnerId: Joi.string().allow("").optional(),
});

export const updateStudentSchema = Joi.object({
  fullName: Joi.string().optional(),
  phone: Joi.string().pattern(/^(0[35789]\d{8})$/).optional().messages({
    "string.pattern.base": "Số điện thoại không hợp lệ (phải gồm 10 chữ số bắt đầu bằng 03, 05, 07, 08 hoặc 09).",
  }),
  email: Joi.string().email().allow("").optional(),
  referral: Joi.string().allow("").optional(),
  birthday: birthdaySchema.allow("").optional(),
  idCard: Joi.string().pattern(/^(\d{9}|\d{12})$/).allow("").optional().messages({
    "string.pattern.base": "Số CCCD/CMND phải có 9 hoặc 12 chữ số.",
  }),
  rank: Joi.string().allow("").optional(),
  courseId: objectIdSchema.allow("").optional(),
  registrationDate: Joi.string().optional(),
  enrollmentDate: dateSchema.allow("").optional(),
  fee: Joi.string().optional(),
  address: Joi.string().allow("").optional(),
  status: Joi.alternatives().try(
    Joi.array().items(Joi.string().valid(...STUDENT_STATUSES)),
    Joi.string().valid(...STUDENT_STATUSES)
  ).optional(),
  healthCheckDate: Joi.string().allow("").optional(),
  healthCheckNotes: Joi.string().allow("").optional(),
  healthCheckFiles: Joi.array().items(uploadedFileSchema).optional(),
  idCardFrontFile: uploadedFileSchema.allow(null).optional(),
  idCardBackFile: uploadedFileSchema.allow(null).optional(),
  vneidIdCardFile: uploadedFileSchema.allow(null).optional(),
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
  centerId: Joi.string().allow("").optional(),
  partnerId: Joi.string().allow("").optional(),
});

export const publicRegisterStudentSchema = Joi.object({
  fullName: Joi.string().required().messages({
    "any.required": "Họ và tên là bắt buộc.",
    "string.empty": "Họ và tên không được để trống.",
  }),
  phone: Joi.string().required().pattern(/^(0[35789]\d{8})$/).messages({
    "any.required": "Số điện thoại là bắt buộc.",
    "string.empty": "Số điện thoại không được để trống.",
    "string.pattern.base": "Số điện thoại không hợp lệ (phải gồm 10 chữ số bắt đầu bằng 03, 05, 07, 08 hoặc 09).",
  }),
  referral: Joi.string().allow("").optional(),
  email: Joi.string().email().required().messages({
    "any.required": "Email là bắt buộc.",
    "string.empty": "Email không được để trống.",
    "string.email": "Định dạng email không hợp lệ.",
  }),
  birthday: birthdaySchema.required().messages({
    "any.required": "Ngày sinh là bắt buộc.",
    "string.empty": "Ngày sinh không được để trống.",
    "date.invalid": "Ngày sinh không hợp lệ hoặc không đúng định dạng DD/MM/YYYY.",
  }),
  idCard: Joi.string().allow("").optional(),
  rank: Joi.string().allow("").optional(),
  courseId: objectIdSchema.allow("").optional(),
  enrollmentDate: dateSchema.required().messages({
    "any.required": "Ngày nhập học là bắt buộc.",
    "string.empty": "Ngày nhập học không được để trống.",
    "date.invalid": "Ngày nhập học không hợp lệ hoặc không đúng định dạng DD/MM/YYYY.",
  }),
  address: Joi.string().required().messages({
    "any.required": "Địa chỉ là bắt buộc.",
    "string.empty": "Địa chỉ không được để trống.",
  }),
  idCardFrontFile: uploadedFileSchema.optional(),
  idCardBackFile: uploadedFileSchema.optional(),
  vneidIdCardFile: uploadedFileSchema.optional(),
  portraitFile: uploadedFileSchema.optional(),
  teacherId: objectIdSchema.required().messages({
    "any.required": "ID giáo viên là bắt buộc.",
    "string.empty": "ID giáo viên không được để trống.",
  }),
});
