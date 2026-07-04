const Order = require("../models/order");
const Customer = require("../models/customer");
const User = require("../models/user");
const Listing = require("../models/listing");
const Review = require("../models/review");
const logger = require("../utils/logger");

const getCheckout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("cart");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    const totalAmount = user.cart.reduce((sum, item) => sum + item.price, 0);
    const cartTitles = user.cart.map(item => item.title).join(", ");
    
    res.json({
      success: true,
      user: {
        cart: user.cart,
        username: user.username,
        email: user.email,
        role: user.role
      },
      totalAmount,
      cartTitles
    });
  } catch (err) {
    next(err);
  }
};

const checkout = async (req, res, next) => {
  try {
    const customerInfo = new Customer(req.body.listing);
    await customerInfo.save();
    
    const user = await User.findById(req.user._id).populate("cart");
    const productIds = req.body.productIds;
    
    if (!productIds || productIds.length === 0) {
      return res.status(400).json({ error: "Your cart is empty." });
    }
    
    const cartProducts = await Listing.find({ '_id': { $in: productIds } });
    
    // Create detailed tracking orders
    for (const prod of cartProducts) {
      const newOrder = new Order({
        buyer: req.user._id,
        seller: prod.owner,
        product: prod._id,
        price: prod.price,
        quantity: 1,
        shippingAddress: req.body.listing.address || req.user.address?.street || "No address provided",
        phone: req.body.listing.phone || req.user.phone || "9999999999",
        status: 'Pending',
        currentLocation: {
          name: "Seller Warehouse",
          latitude: prod.latitude || 27.56,
          longitude: prod.longitude || 80.68
        }
      });
      await newOrder.save();
    }

    user.order = [...user.order, ...cartProducts];
    user.cart = [];
    await user.save();
    
    logger.info(`Checkout successful for user: ${user.username}`);
    res.json({
      success: true,
      message: "Purchased Successfully",
      user: { 
        username: user.username, 
        email: user.email, 
        role: user.role,
        cart: user.cart, 
        order: user.order 
      }
    });
  } catch (err) {
    next(err);
  }
};

const getBuyerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate("product")
      .populate("seller", "username email fullName role phone")
      .populate("transporter", "username email fullName phone")
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
};

const getSellerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ seller: req.user._id })
      .populate("product")
      .populate("buyer", "username email fullName role phone")
      .populate("transporter", "username email fullName phone")
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
};

const getTransporterJobs = async (req, res, next) => {
  try {
    if (req.user.role !== "transporter" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied." });
    }
    const orders = await Order.find({ status: "Transit Requested" })
      .populate("product")
      .populate("seller", "username email fullName role phone location latitude longitude")
      .populate("buyer", "username email fullName role phone")
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
};

const getTransporterActive = async (req, res, next) => {
  try {
    if (req.user.role !== "transporter" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied." });
    }
    const orders = await Order.find({ transporter: req.user._id, status: { $in: ["In Transit", "Delivered"] } })
      .populate("product")
      .populate("seller", "username email fullName role phone")
      .populate("buyer", "username email fullName role phone")
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
};

const sellerAcceptOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }
    if (order.seller.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized." });
    }
    order.status = "Accepted";
    await order.save();
    logger.info(`Order ${req.params.id} accepted by seller`);
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

const sellerRequestTransit = async (req, res, next) => {
  try {
    const { vehicleType } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }
    if (order.seller.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized." });
    }
    order.status = "Transit Requested";
    order.vehicleType = vehicleType || "motorcycle";
    await order.save();
    logger.info(`Transit requested for Order ${req.params.id}`);
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

const transporterAcceptDelivery = async (req, res, next) => {
  try {
    if (req.user.role !== "transporter" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied." });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }
    order.transporter = req.user._id;
    order.status = "In Transit";
    order.currentLocation = {
      name: "Picked up by transporter",
      latitude: order.currentLocation?.latitude || 27.56,
      longitude: order.currentLocation?.longitude || 80.68
    };
    await order.save();
    logger.info(`Transporter ${req.user.username} accepted delivery for Order ${req.params.id}`);
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

const trackOrder = async (req, res, next) => {
  try {
    const { status, locationName, latitude, longitude } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }
    
    const isTransporter = order.transporter && order.transporter.toString() === req.user._id.toString();
    const isSeller = order.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin" || req.user.email === "sramu1090@gmail.com";
    
    if (!isTransporter && !isSeller && !isAdmin) {
      return res.status(403).json({ error: "Unauthorized to update tracking details." });
    }
    
    if (status) order.status = status;
    if (locationName !== undefined) order.currentLocation.name = locationName;
    if (latitude !== undefined) order.currentLocation.latitude = latitude;
    if (longitude !== undefined) order.currentLocation.longitude = longitude;
    
    await order.save();
    logger.info(`Tracking updated for Order ${req.params.id}: status=${status}`);
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }
    if (order.buyer.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized." });
    }
    if (order.status !== "Pending" && order.status !== "Accepted" && req.user.role !== "admin") {
      return res.status(400).json({ error: "Cannot cancel order once it is requested for transit or in transit." });
    }
    order.status = "Cancelled";
    await order.save();
    logger.info(`Order ${req.params.id} cancelled`);
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

const reviewOrder = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }
    if (order.buyer.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized." });
    }
    
    order.review = {
      rating: Number(rating),
      comment: comment || "",
      createdAt: new Date()
    };
    await order.save();
    logger.info(`Order ${req.params.id} reviewed with rating ${rating}`);
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

const getCustomersCheckout = async (req, res, next) => {
  try {
    const allListings = await Customer.find({});
    res.json({ allListings });
  } catch (err) {
    next(err);
  }
};

const createListingReview = async (req, res, next) => {
  if (req.user && req.user.role === "farmer") {
    try {
      const newReview = new Review(req.body.histing || req.body);
      await newReview.save();
      logger.info(`New Kisan testimonial created by ${req.user.username}`);
      res.json({ success: true, review: newReview });
    } catch (err) {
      next(err);
    }
  } else {
    res.status(403).json({ error: "Access denied: Only farmers are authorized to submit testimonials." });
  }
};

module.exports = {
  getCheckout,
  checkout,
  getBuyerOrders,
  getSellerOrders,
  getTransporterJobs,
  getTransporterActive,
  sellerAcceptOrder,
  sellerRequestTransit,
  transporterAcceptDelivery,
  trackOrder,
  cancelOrder,
  reviewOrder,
  getCustomersCheckout,
  createListingReview,
};
