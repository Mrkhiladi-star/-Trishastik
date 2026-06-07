const { AppError } = require("../utils/errors");

const validateBody = (schema) => {
  return (req, res, next) => {
    // We validate req.body against schema. If there's an key like listing or soilTest, we might validate that directly.
    // Let's make it flexible: if the body contains a parent key (e.g. listing, soilTest, pisting, histing) we can validate either the parent or the whole body.
    // In our backend/index.js we have req.body.soilTest, req.body.listing, req.body.histing, etc.
    // Let's extract the data to validate:
    let dataToValidate = req.body;
    
    // Check if the body has a wrapper key and if the schema expects it or not.
    // To support Joi validation seamlessly:
    const { error, value } = schema.validate(dataToValidate, { abortEarly: false, allowUnknown: true });
    
    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(", ");
      return next(new AppError(errorMessage, 400));
    }
    
    req.body = value;
    next();
  };
};

module.exports = {
  validateBody,
};
