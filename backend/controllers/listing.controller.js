const Listing = require("../models/listing");
const Review = require("../models/review");
const User = require("../models/user");
const cacheService = require("../services/redis.service");
const logger = require("../utils/logger");

const getHomeData = async (req, res, next) => {
  try {
    const cacheKey = "marketplace:home";
    const cachedData = await cacheService.getCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const allListings = await Listing.find({}).populate("owner", "username email");
    const allReviews = await Review.find({});
    
    const homeData = { allReviews, allListings };
    await cacheService.setCache(cacheKey, homeData, 300); // Cache for 5 mins
    
    res.json(homeData);
  } catch (err) {
    next(err);
  }
};

const checkNewListingPermission = async (req, res) => {
  const allowedEmail = "freeforfire15@gmail.com";
  const isAuthorized = req.user && (
    req.user.email === allowedEmail || 
    req.user.role === "farmer" || 
    req.user.role === "fertilizer_seller" || 
    req.user.role === "instrument_seller" || 
    req.user.role === "admin"
  );
  if (isAuthorized) {
    res.json({ authorized: true });
  } else {
    res.status(403).json({ error: "Access denied: Only farmers, sellers and admins can list products." });
  }
};

const createListing = async (req, res, next) => {
  try {
    const { title, description, price, image, category, location, latitude, longitude } = req.body.listing || req.body;
    const newListing = new Listing({
      title,
      description,
      price,
      image,
      category: category || "organic_product",
      location: location || "",
      latitude: latitude !== undefined ? Number(latitude) : 27.56,
      longitude: longitude !== undefined ? Number(longitude) : 80.68,
      owner: req.user._id,
    });
    
    await newListing.save();
    
    // Invalidate home data and listing caches
    await cacheService.delCache("marketplace:home");
    await cacheService.delCache("marketplace:listings");
    
    logger.info(`Listing created successfully: ${title} by ${req.user.username}`);
    res.json({ success: true, listing: newListing });
  } catch (err) {
    next(err);
  }
};

const getSellerListings = async (req, res, next) => {
  try {
    const myListings = await Listing.find({ owner: req.user._id });
    res.json({ myListings });
  } catch (err) {
    next(err);
  }
};

const addToCart = async (req, res, next) => {
  const allowedEmail = "freeforfire15@gmail.com";
  // Admin and farmers cannot buy products (standard e-commerce practice)
  if (req.user && req.user.role !== "farmer" && req.user.email !== allowedEmail) {
    try {
      let user = await User.findById(req.user._id);
      user.cart.push(req.params.productid);
      await user.save();
      logger.info(`Product ${req.params.productid} added to cart for user ${req.user.username}`);
      res.json({ success: true, message: "Added to cart", cart: user.cart });
    } catch (err) {
      next(err);
    }
  } else {
    res.status(403).json({ error: "Access denied: Sellers and administrators cannot buy products." });
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.cart = user.cart.filter(productId => productId.toString() !== req.params.productid);
    await user.save();
    logger.info(`Product ${req.params.productid} removed from cart for user ${req.user.username}`);
    res.json({ success: true, message: "Removed from cart", cart: user.cart });
  } catch (err) {
    next(err);
  }
};

const getShopData = async (req, res, next) => {
  const allowedEmail = "freeforfire15@gmail.com";
  if (req.user && req.user.role !== "farmer" && req.user.email !== allowedEmail) {
    try {
      let user = await User.findById(req.user._id).populate("cart");
      let users = await User.findById(req.user._id).populate("order");
      const totalAmount = user.cart.reduce((sum, item) => sum + item.price, 0);
      
      // Cache the all listings query
      const listingsCacheKey = "marketplace:listings";
      let allListings = await cacheService.getCache(listingsCacheKey);
      
      if (!allListings) {
        allListings = await Listing.find({}).populate("owner", "username email");
        await cacheService.setCache(listingsCacheKey, allListings, 300);
      }
      
      const cartTitles = user.cart.map(item => item.title).join(", ");
      res.json({ user, users, totalAmount, cartTitles, allListings });
    } catch (err) {
      next(err);
    }
  } else {
    res.status(403).json({ error: "Access denied: Shop views are restricted to customers." });
  }
};

module.exports = {
  getHomeData,
  checkNewListingPermission,
  createListing,
  getSellerListings,
  addToCart,
  removeFromCart,
  getShopData,
};
