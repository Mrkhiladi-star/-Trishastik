const isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "You must be logged in." });
  }
  next();
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    
    // Normalize role strings (e.g. fertilizerSeller -> fertilizer_seller)
    const normalizeRole = (role) => {
      if (!role) return "";
      const mapping = {
        fertilizerSeller: "fertilizer_seller",
        equipmentSeller: "instrument_seller",
        fieldAgent: "agent",
      };
      return mapping[role] || role;
    };

    const userRole = normalizeRole(req.user.role);
    const normalizedAllowedRoles = allowedRoles.map(r => normalizeRole(r));

    if (!normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({ error: "Access denied: Unauthorized role." });
    }
    next();
  };
};

module.exports = {
  isLoggedIn,
  authorizeRoles,
};
