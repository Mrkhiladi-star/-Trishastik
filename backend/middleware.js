const { isLoggedIn } = require("./middleware/auth");

module.exports = {
  isLoggedIn,
  saveRedirectUrl: (req, res, next) => next(),
};