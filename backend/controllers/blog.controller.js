const Blog = require("../models/blog");
const logger = require("../utils/logger");

const getBlogs = async (req, res, next) => {
  try {
    const allListings = await Blog.find({});
    res.json({ allListings });
  } catch (err) {
    next(err);
  }
};

const checkBlogPermission = async (req, res) => {
  const allowedEmail = "sramu1090@gmail.com";
  if (req.user && (req.user.email === allowedEmail || req.user.role === "admin")) {
    res.json({ authorized: true });
  } else {
    res.status(403).json({ error: "Access denied: Only admins can write blogs." });
  }
};

const createBlog = async (req, res, next) => {
  try {
    // Accepts req.body.pisting or req.body directly
    const blogData = req.body.pisting || req.body;
    const newBlog = new Blog(blogData);
    await newBlog.save();
    logger.info(`New blog posted: ${newBlog.title}`);
    res.json({ success: true, blog: newBlog });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBlogs,
  checkBlogPermission,
  createBlog,
};
