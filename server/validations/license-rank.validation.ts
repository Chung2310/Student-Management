import Joi from "joi";

export const createLicenseRankSchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "Tên hạng bằng là bắt buộc.",
    "string.empty": "Tên hạng bằng không được để trống.",
  }),
});
