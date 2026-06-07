const Joi = require("joi");

const createListingSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  price: Joi.number().min(0).required(),
  image: Joi.string().allow("").optional(),
  category: Joi.string().valid("organic_product", "medicine_fertilizer", "instrument_sale", "instrument_rent").optional(),
  location: Joi.string().allow("").optional(),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
});

module.exports = {
  createListingSchema,
};
