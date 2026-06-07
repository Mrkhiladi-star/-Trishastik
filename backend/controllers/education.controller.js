const Education = require("../models/education");
const logger = require("../utils/logger");

const getEducation = async (req, res, next) => {
  try {
    const allListings = await Education.find({});
    res.json({ allListings });
  } catch (err) {
    next(err);
  }
};

const checkEducationPermission = async (req, res) => {
  const allowedEmail = "freeforfire15@gmail.com";
  if (req.user && (req.user.email === allowedEmail || req.user.role === "admin")) {
    res.json({ authorized: true });
  } else {
    res.status(403).json({ error: "Access denied: Only admins can add educational resources." });
  }
};

const createEducation = async (req, res, next) => {
  try {
    // Accepts req.body.histing or req.body directly
    const eduData = req.body.histing || req.body;
    const newEducation = new Education(eduData);
    await newEducation.save();
    logger.info(`New educational material added: ${newEducation.title}`);
    res.json({ success: true, education: newEducation });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEducation,
  checkEducationPermission,
  createEducation,
};
