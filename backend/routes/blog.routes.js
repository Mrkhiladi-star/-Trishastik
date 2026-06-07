const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blog.controller");
const { isLoggedIn } = require("../middleware/auth");

router.get("/blog", blogController.getBlogs);
router.get("/blognew", isLoggedIn, blogController.checkBlogPermission);
router.post("/blognew", isLoggedIn, blogController.createBlog);

module.exports = router;
