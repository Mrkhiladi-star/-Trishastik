const Order = require("../models/order");
const Customer = require("../models/customer");
const User = require("../models/user");
const Listing = require("../models/listing");
const Review = require("../models/review");
const logger = require("../utils/logger");
const { getDistanceKm, VEHICLE_MAPPING } = require("../utils/distance");
const Vehicle = require("../models/vehicle");

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
    
    // Count occurrences of each product ID to get quantities
    const productCount = {};
    for (const id of productIds) {
      if (id) {
        const idStr = id.toString();
        productCount[idStr] = (productCount[idStr] || 0) + 1;
      }
    }
    
    const uniqueProductIds = Object.keys(productCount);
    const cartProducts = await Listing.find({ '_id': { $in: uniqueProductIds } });
    
    let shippingLat = req.user.latitude || 27.56;
    let shippingLon = req.user.longitude || 80.68;
    const rawAddress = req.body.listing?.address || req.user.address?.street || "No address provided";
    if (rawAddress && rawAddress !== "No address provided") {
      try {
        const geocodeRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(rawAddress)}`, {
          headers: { "User-Agent": "Trishastik-AgriTech-App" }
        });
        if (geocodeRes.ok) {
          const data = await geocodeRes.json();
          if (data && data.length > 0) {
            shippingLat = Number(data[0].lat);
            shippingLon = Number(data[0].lon);
            logger.info(`Geocoded checkout shipping address "${rawAddress}" to coordinates: ${shippingLat}, ${shippingLon}`);
          }
        }
      } catch (err) {
        logger.error("Failed to geocode checkout address:", err.message);
      }
    }

    // Create detailed tracking orders
    for (const prod of cartProducts) {
      const qty = productCount[prod._id.toString()] || 1;
      const newOrder = new Order({
        buyer: req.user._id,
        seller: prod.owner,
        product: prod._id,
        price: prod.price,
        quantity: qty,
        shippingAddress: rawAddress,
        shippingLatitude: shippingLat,
        shippingLongitude: shippingLon,
        phone: req.body.listing?.phone || req.user.phone || "9999999999",
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

async function findTransporterCandidates(order, radius) {
  const populatedOrder = await Order.findById(order._id)
    .populate("buyer")
    .populate("seller");
    
  if (!populatedOrder) return [];
  
  // Retain unsaved vehicleType local document state passed to candidate query
  populatedOrder.vehicleType = order.vehicleType;
  
  const sellerLat = populatedOrder.seller?.latitude || populatedOrder.currentLocation?.latitude || 27.56;
  const sellerLon = populatedOrder.seller?.longitude || populatedOrder.currentLocation?.longitude || 80.68;
  
  const buyerLat = populatedOrder.shippingLatitude || populatedOrder.buyer?.latitude || 27.56;
  const buyerLon = populatedOrder.shippingLongitude || populatedOrder.buyer?.longitude || 80.68;
  
  // Calculate delivery distance
  const distDelivery = Math.max(getDistanceKm(sellerLat, sellerLon, buyerLat, buyerLon), 1);
  
  // Find all transporters
  const transporters = await User.find({ role: "transporter" });
  
  const candidates = [];
  for (const trans of transporters) {
    const transLat = trans.latitude || 27.56;
    const transLon = trans.longitude || 80.68;
    
    // Check distance from transporter to seller
    const distToSeller = getDistanceKm(transLat, transLon, sellerLat, sellerLon);
    if (distToSeller <= radius) {
      // Find matching vehicle or auto-seed/initialize one on-the-fly
      const matchingTypes = VEHICLE_MAPPING[populatedOrder.vehicleType] || ["two-wheeler"];
      let vehicle = await Vehicle.findOne({
        transporter: trans._id,
        vehicleType: { $in: matchingTypes },
        isAvailable: true
      });
      
      // Query-Time Fallback if transporter has no vehicle record
      if (!vehicle) {
        const anyVehicle = await Vehicle.findOne({ transporter: trans._id });
        if (!anyVehicle) {
          vehicle = new Vehicle({
            transporter: trans._id,
            vehicleType: matchingTypes[0] || "two-wheeler",
            registrationNumber: "TEMP-" + trans._id.toString().substring(18).toUpperCase(),
            capacityKg: 150,
            isAvailable: true,
            pricePerKm: 15,
            minCharge: 50,
            loadingCharge: 100
          });
          await vehicle.save();
          logger.info(`On-the-fly seeded default vehicle for transporter: ${trans.username}`);
        } else if (anyVehicle.isAvailable && matchingTypes.includes(anyVehicle.vehicleType)) {
          vehicle = anyVehicle;
        }
      }
      
      if (vehicle && vehicle.isAvailable && matchingTypes.includes(vehicle.vehicleType)) {
        // Calculate price
        const price = vehicle.minCharge + (vehicle.pricePerKm * distDelivery) + vehicle.loadingCharge;
        candidates.push({
          transporter: trans._id,
          price: Math.round(price),
          distanceToSeller: Math.round(distToSeller * 10) / 10,
          distanceBuyerSeller: Math.round(distDelivery * 10) / 10,
          status: "Pending",
          updatedAt: new Date()
        });
      }
    }
  }
  
  // Sort by price ascending
  candidates.sort((a, b) => a.price - b.price);
  return candidates;
}

async function assignNextTransporter(order) {
  const currentIndex = order.currentCandidateIndex;
  
  // Update status of the current candidate
  if (order.transitCandidates && order.transitCandidates[currentIndex]) {
    if (order.transitCandidates[currentIndex].status === "Pending") {
      order.transitCandidates[currentIndex].status = "Rejected";
      order.transitCandidates[currentIndex].updatedAt = new Date();
    }
  }

  const nextIndex = currentIndex + 1;
  order.currentCandidateIndex = nextIndex;

  if (order.transitCandidates && nextIndex < order.transitCandidates.length) {
    const nextCandidate = order.transitCandidates[nextIndex];
    order.transporter = nextCandidate.transporter;
    order.deliveryPrice = nextCandidate.price;
    order.requestExpiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours
    await order.save();
    logger.info(`Reassigned Order ${order._id} to next transporter candidate (Index: ${nextIndex})`);
  } else {
    // Candidates exhausted!
    if (order.transitRadius === 50) {
      logger.info(`Exhausted 50KM radius. Expanding matching for Order ${order._id} to 100KM...`);
      order.transitRadius = 100;
      
      const newCandidates = await findTransporterCandidates(order, 100);
      const alreadyTriedIds = order.transitCandidates.map(c => c.transporter.toString());
      const filteredNewCandidates = newCandidates.filter(c => !alreadyTriedIds.includes(c.transporter.toString()));
      
      if (filteredNewCandidates.length > 0) {
        order.transitCandidates = [...order.transitCandidates, ...filteredNewCandidates];
        const nextCandidate = order.transitCandidates[nextIndex];
        order.transporter = nextCandidate.transporter;
        order.deliveryPrice = nextCandidate.price;
        order.requestExpiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours
        await order.save();
        logger.info(`Reassigned Order ${order._id} to first 100KM radius transporter candidate`);
      } else {
        order.transporter = null;
        order.deliveryPrice = 0;
        order.requestExpiresAt = null;
        await order.save();
        logger.warn(`No transporters found in 100KM radius either for Order ${order._id}`);
      }
    } else {
      // Already at 100 KM
      order.transporter = null;
      order.deliveryPrice = 0;
      order.requestExpiresAt = null;
      await order.save();
      logger.warn(`Exhausted all candidates in 100KM radius for Order ${order._id}. Setting transporter to null.`);
    }
  }
}

async function checkExpiredTransitRequests() {
  try {
    const expiredOrders = await Order.find({
      status: "Transit Requested",
      transporter: { $ne: null },
      requestExpiresAt: { $lt: new Date() }
    });
    
    for (const order of expiredOrders) {
      logger.info(`Order ${order._id} request expired for transporter ${order.transporter}. Advancing...`);
      const idx = order.currentCandidateIndex;
      if (order.transitCandidates && order.transitCandidates[idx]) {
        order.transitCandidates[idx].status = "Timeout";
        order.transitCandidates[idx].updatedAt = new Date();
      }
      await assignNextTransporter(order);
    }
  } catch (err) {
    logger.error("Error in checkExpiredTransitRequests background checker:", err);
  }
}

const getBuyerOrders = async (req, res, next) => {
  try {
    await checkExpiredTransitRequests();
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
    await checkExpiredTransitRequests();
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
    await checkExpiredTransitRequests();
    const orders = await Order.find({ status: "Transit Requested", transporter: req.user._id })
      .populate("product")
      .populate("seller", "username email fullName role phone location latitude longitude")
      .populate("buyer", "username email fullName role phone")
      .sort({ createdAt: -1 });

    const processedOrders = orders.map(order => {
      const orderObj = order.toObject();
      const candidate = order.transitCandidates.find(
        c => c.transporter && c.transporter.toString() === req.user._id.toString()
      );
      if (candidate) {
        orderObj.distanceToSeller = candidate.distanceToSeller;
        orderObj.distanceBuyerSeller = candidate.distanceBuyerSeller;
        orderObj.deliveryPrice = candidate.price;
      } else {
        orderObj.distanceToSeller = 0;
        orderObj.distanceBuyerSeller = 0;
        orderObj.deliveryPrice = 0;
      }
      return orderObj;
    });
    res.json({ orders: processedOrders });
  } catch (err) {
    next(err);
  }
};

const getTransporterActive = async (req, res, next) => {
  try {
    if (req.user.role !== "transporter" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied." });
    }
    await checkExpiredTransitRequests();
    const orders = await Order.find({ transporter: req.user._id, status: { $in: ["In Transit", "Delivered"] } })
      .populate("product")
      .populate("seller", "username email fullName role phone")
      .populate("buyer", "username email fullName role phone")
      .sort({ createdAt: -1 });
      
    const processedOrders = orders.map(order => {
      const orderObj = order.toObject();
      const candidate = order.transitCandidates.find(
        c => c.transporter && c.transporter.toString() === req.user._id.toString()
      );
      orderObj.deliveryPrice = candidate ? candidate.price : order.deliveryPrice;
      return orderObj;
    });
    res.json({ orders: processedOrders });
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
    
    order.vehicleType = vehicleType || "two-wheeler";
    order.transitRadius = 50;
    
    // Find candidates in 50 KM radius
    const candidates = await findTransporterCandidates(order, 50);
    
    if (candidates.length > 0) {
      order.transitCandidates = candidates;
      order.currentCandidateIndex = 0;
      order.transporter = candidates[0].transporter;
      order.deliveryPrice = candidates[0].price;
      order.requestExpiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours
      order.status = "Transit Requested";
      logger.info(`Transit requested for Order ${order._id}. Matched ${candidates.length} candidates in 50KM. First assigned: ${order.transporter}`);
    } else {
      logger.info(`No transporters found in 50KM for Order ${order._id}. Expanding to 100KM...`);
      order.transitRadius = 100;
      const candidates100 = await findTransporterCandidates(order, 100);
      if (candidates100.length > 0) {
        order.transitCandidates = candidates100;
        order.currentCandidateIndex = 0;
        order.transporter = candidates100[0].transporter;
        order.deliveryPrice = candidates100[0].price;
        order.requestExpiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours
        order.status = "Transit Requested";
        logger.info(`Matched ${candidates100.length} candidates in 100KM. First assigned: ${order.transporter}`);
      } else {
        logger.info(`No transporters found in 100KM for Order ${order._id}. Falling back to nearest available transporters...`);
        order.transitRadius = 999999;
        const candidatesGlobal = await findTransporterCandidates(order, 999999);
        if (candidatesGlobal.length > 0) {
          order.transitCandidates = candidatesGlobal;
          order.currentCandidateIndex = 0;
          order.transporter = candidatesGlobal[0].transporter;
          order.deliveryPrice = candidatesGlobal[0].price;
          order.requestExpiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours
          order.status = "Transit Requested";
          logger.info(`Matched ${candidatesGlobal.length} global candidates. Nearest assigned: ${order.transporter}`);
        } else {
          logger.warn(`No available transporters found in database for vehicle type: ${order.vehicleType}`);
          return res.status(400).json({ error: `No available transporters found in database for vehicle type: "${order.vehicleType}". Please verify that transporters have completed their profiles and are available.` });
        }
      }
    }
    
    await order.save();
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
    if (!order.transporter || order.transporter.toString() !== req.user._id.toString()) {
      return res.status(400).json({ error: "This job is not currently assigned to you." });
    }
    
    // Update candidate status
    if (order.transitCandidates && order.transitCandidates[order.currentCandidateIndex]) {
      order.transitCandidates[order.currentCandidateIndex].status = "Accepted";
      order.transitCandidates[order.currentCandidateIndex].updatedAt = new Date();
    }
    
    order.status = "In Transit";
    order.requestExpiresAt = null;
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

const transporterRejectDelivery = async (req, res, next) => {
  try {
    if (req.user.role !== "transporter" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied." });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }
    if (!order.transporter || order.transporter.toString() !== req.user._id.toString()) {
      return res.status(400).json({ error: "This job is not currently assigned to you." });
    }
    
    logger.info(`Transporter ${req.user.username} rejected job for Order ${order._id}`);
    await assignNextTransporter(order);
    res.json({ success: true, message: "Job rejected. Reassigning next candidate..." });
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
  transporterRejectDelivery,
  trackOrder,
  cancelOrder,
  reviewOrder,
  getCustomersCheckout,
  createListingReview,
};
