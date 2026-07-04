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
  const isAuthorized = req.user && (
    req.user.role === "farmer" || 
    req.user.role === "fertilizer_seller" || 
    req.user.role === "instrument_seller"
  );
  if (isAuthorized) {
    res.json({ authorized: true });
  } else {
    res.status(403).json({ error: "Access denied: Only farmers and sellers can list products." });
  }
};

const createListing = async (req, res, next) => {
  try {
    const allowedEmail = "sramu1090@gmail.com";
    if (req.user && (req.user.role === "admin" || req.user.email === allowedEmail)) {
      return res.status(403).json({ error: "Access denied: Administrators cannot list products." });
    }

    const { title, description, price, image, category, location, latitude, longitude, priceUnit, images, video } = req.body.listing || req.body;
    const newListing = new Listing({
      title,
      description,
      price,
      image,
      category: category || "organic_product",
      location: location || "",
      latitude: latitude !== undefined ? Number(latitude) : 27.56,
      longitude: longitude !== undefined ? Number(longitude) : 80.68,
      priceUnit: priceUnit || "kg",
      images: images || [],
      video: video || "",
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
  const allowedEmail = "sramu1090@gmail.com";
  if (req.user && req.user.role !== "admin" && req.user.role !== "transporter" && req.user.role !== "agent" && req.user.email !== allowedEmail) {
    try {
      const product = await Listing.findById(req.params.productid);
      if (!product) {
        return res.status(404).json({ error: "Product not found." });
      }

      if (req.user.role === "farmer" && product.category === "organic_product") {
        return res.status(403).json({ error: "Access denied: Farmers cannot buy organic crop products." });
      }

      let user = await User.findById(req.user._id);
      user.cart.push(req.params.productid);
      await user.save();
      logger.info(`Product ${req.params.productid} added to cart for user ${req.user.username}`);
      res.json({ success: true, message: "Added to cart", cart: user.cart });
    } catch (err) {
      next(err);
    }
  } else {
    res.status(403).json({ error: "Access denied: You are not authorized to buy products." });
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
  const allowedEmail = "sramu1090@gmail.com";
  if (req.user && req.user.role !== "admin" && req.user.role !== "transporter" && req.user.role !== "agent" && req.user.email !== allowedEmail) {
    try {
      let user = await User.findById(req.user._id).populate("cart");
      let users = await User.findById(req.user._id).populate("order");
      const totalAmount = user.cart ? user.cart.reduce((sum, item) => sum + (item.price || 0), 0) : 0;
      
      const listingsCacheKey = "marketplace:listings";
      let allListings = await cacheService.getCache(listingsCacheKey);
      
      if (!allListings) {
        allListings = await Listing.find({}).populate("owner", "username email");
        await cacheService.setCache(listingsCacheKey, allListings, 300);
      }
      
      const cartTitles = user.cart ? user.cart.map(item => item.title).join(", ") : "";
      res.json({ user, users, totalAmount, cartTitles, allListings });
    } catch (err) {
      next(err);
    }
  } else {
    res.status(403).json({ error: "Access denied: Shop views are restricted." });
  }
};

const getListingDetails = async (req, res, next) => {
  try {
    const listingId = req.params.id;
    const listing = await Listing.findById(listingId).populate("owner", "username email fullName");
    if (!listing) {
      return res.status(404).json({ error: "Product not found." });
    }

    const Order = require("../models/order");
    const completedOrders = await Order.find({
      product: listingId,
      status: "Delivered",
      "review.rating": { $gt: 0 }
    }).populate("buyer", "username fullName");

    const reviews = completedOrders.map(order => ({
      _id: order._id,
      rating: order.review.rating,
      comment: order.review.comment,
      createdAt: order.review.createdAt || order.createdAt,
      reviewer: order.buyer ? (order.buyer.fullName || order.buyer.username) : "Anonymous"
    }));

    res.json({ listing, reviews });
  } catch (err) {
    next(err);
  }
};

const deleteListing = async (req, res, next) => {
  try {
    const listingId = req.params.id;
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ error: "Product listing not found." });
    }

    const allowedEmail = "sramu1090@gmail.com";
    const isOwner = listing.owner && listing.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin" || req.user.email === allowedEmail;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Access denied: You are not authorized to delete this listing." });
    }

    await Listing.findByIdAndDelete(listingId);
    
    // Invalidate home data and listing caches
    await cacheService.delCache("marketplace:home");
    await cacheService.delCache("marketplace:listings");
    
    logger.info(`Listing deleted successfully: ${listing.title} by ${req.user.username}`);
    res.json({ success: true, message: "Listing deleted successfully." });
  } catch (err) {
    next(err);
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
  getListingDetails,
  deleteListing,
};
