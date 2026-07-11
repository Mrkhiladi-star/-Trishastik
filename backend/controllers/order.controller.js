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
        isAvailable: true,
        $or: [
          { availableCount: { $exists: false } },
          { availableCount: { $gt: 0 } }
        ]
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

const refundPayment = async (paymentId, amountINR) => {
  try {
    const Razorpay = require("razorpay");
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(amountINR * 100) // in paise
    });
    logger.info(`Razorpay Refund response for paymentId ${paymentId}: ${refund.id}`);
    return refund;
  } catch (err) {
    logger.error(`Razorpay Refund API error for paymentId ${paymentId}: ${err.message}`);
  }
};

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
    order.requestExpiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours
    await order.save();
    logger.info(`Reassigned Order ${order._id} to next transporter candidate (Index: ${nextIndex})`);
  } else {
    // Candidates exhausted! Cancel order automatically
    order.status = "Cancelled";
    order.transporter = null;
    order.deliveryPrice = 0;
    order.requestExpiresAt = null;
    await order.save();
    logger.warn(`Logistics matching exhausted all candidates. Automatically cancelling Order ${order._id}`);

    // Trigger email notification to buyer
    try {
      const populatedOrder = await Order.findById(order._id)
        .populate("buyer", "username email fullName")
        .populate("product", "title");
        
      const emailService = require("../services/email.service");
      if (populatedOrder && populatedOrder.buyer && populatedOrder.product) {
        await emailService.sendOrderCancellationTransporterExhaustedEmail(
          populatedOrder.buyer.email,
          populatedOrder.buyer.username,
          populatedOrder.product.title,
          populatedOrder._id
        );
      }
    } catch (notifyErr) {
      logger.error(`Failed to send cancellation notification email for Order ${order._id}: ${notifyErr.message}`);
    }

    // Trigger Razorpay Refund
    try {
      const PaymentSession = require("../models/paymentSession");
      const sessionById = await PaymentSession.findById(order.paymentSession);
      if (sessionById && sessionById.razorpayPaymentId && sessionById.status === "Paid") {
        const refundAmount = order.price + (order.deliveryPrice || 0);
        await refundPayment(sessionById.razorpayPaymentId, refundAmount);
        
        sessionById.status = "Refunded";
        await sessionById.save();
        logger.info(`Refund initiated successfully for Order ${order._id} amount: ${refundAmount}`);
      }
    } catch (refundErr) {
      logger.error(`Failed to trigger Razorpay refund on candidate exhaustion for Order ${order._id}: ${refundErr.message}`);
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
    
    // Bypass transporter matching for self-pickup machinery
    if (order.vehicleType === "self-pickup") {
      order.transporter = null;
      order.deliveryPrice = 0;
      await order.save();
      logger.info(`Auto Dispatch: Skipped transporter matching for self-pickup Order ${order._id}`);
      return res.json({ success: true, order });
    }
    
    order.transitRadius = 50;
    
    // Find candidates in 50 KM radius automatically
    const candidates = await findTransporterCandidates(order, 50);
    
    if (candidates.length > 0) {
      order.transitCandidates = candidates;
      order.currentCandidateIndex = 0;
      order.transporter = candidates[0].transporter;
      order.deliveryPrice = candidates[0].price;
      order.requestExpiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours
      order.status = "Transit Requested";
      logger.info(`Auto Dispatch: Transit requested for Order ${order._id}. Matched ${candidates.length} candidates in 50KM. First assigned: ${order.transporter}`);
    } else {
      logger.info(`Auto Dispatch: No transporters found in 50KM for Order ${order._id}. Expanding to 100KM...`);
      order.transitRadius = 100;
      const candidates100 = await findTransporterCandidates(order, 100);
      if (candidates100.length > 0) {
        order.transitCandidates = candidates100;
        order.currentCandidateIndex = 0;
        order.transporter = candidates100[0].transporter;
        order.deliveryPrice = candidates100[0].price;
        order.requestExpiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours
        order.status = "Transit Requested";
        logger.info(`Auto Dispatch: Matched ${candidates100.length} candidates in 100KM. First assigned: ${order.transporter}`);
      } else {
        logger.info(`Auto Dispatch: No transporters found in 100KM for Order ${order._id}. Falling back to global...`);
        order.transitRadius = 999999;
        const candidatesGlobal = await findTransporterCandidates(order, 999999);
        if (candidatesGlobal.length > 0) {
          order.transitCandidates = candidatesGlobal;
          order.currentCandidateIndex = 0;
          order.transporter = candidatesGlobal[0].transporter;
          order.deliveryPrice = candidatesGlobal[0].price;
          order.requestExpiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours
          order.status = "Transit Requested";
          logger.info(`Auto Dispatch: Matched ${candidatesGlobal.length} global candidates. Nearest assigned: ${order.transporter}`);
        } else {
          logger.warn(`Auto Dispatch: No available transporters found for vehicle type: ${order.vehicleType}`);
        }
      }
    }
    
    await order.save();
    logger.info(`Order ${req.params.id} accepted and auto-logistics dispatched`);
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
      order.requestExpiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours
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
        order.requestExpiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours
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
          order.requestExpiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours
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
    
    if (status) {
      order.status = status;
      if (status === "Delivered" && order.isRental) {
        order.rentalStartDate = new Date();
        order.rentalEndDate = new Date(Date.now() + order.rentalDurationDays * 24 * 60 * 60 * 1000);
        
        try {
          const populatedOrder = await Order.findById(order._id)
            .populate("buyer", "username email")
            .populate("seller", "username email")
            .populate("product", "title price");
            
          const emailService = require("../services/email.service");
          if (populatedOrder && populatedOrder.buyer && populatedOrder.seller && populatedOrder.product) {
            const formattedStart = order.rentalStartDate.toLocaleDateString();
            const formattedEnd = order.rentalEndDate.toLocaleDateString();
            
            await emailService.sendRentalDeliveryEmail(
              populatedOrder.buyer.email,
              populatedOrder.buyer.username,
              populatedOrder.seller.username,
              populatedOrder.product.title,
              formattedStart,
              formattedEnd,
              order.rentalDurationDays,
              populatedOrder.product.price
            );
          }
        } catch (err) {
          logger.error("Failed to send rental delivery email: " + err.message);
        }
      }
    }
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
    logger.info(`Review saved for Order ${req.params.id}`);
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

const rentProduct = async (req, res, next) => {
  try {
    const { productId, fullName, address, phone, durationDays, startDate } = req.body;
    const product = await Listing.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }
    
    if (product.category !== "instrument_rent") {
      return res.status(400).json({ error: "Only equipment for rent can be rented." });
    }
    if (product.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "You cannot rent your own equipment listing." });
    }

    let shippingLat = req.user.latitude || 27.56;
    let shippingLon = req.user.longitude || 80.68;
    if (address) {
      try {
        const geocodeRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`, {
          headers: { "User-Agent": "Trishastik-AgriTech-App" }
        });
        if (geocodeRes.ok) {
          const data = await geocodeRes.json();
          if (data && data.length > 0) {
            shippingLat = Number(data[0].lat);
            shippingLon = Number(data[0].lon);
          }
        }
      } catch (err) {
        logger.error("Failed to geocode rental address: " + err.message);
      }
    }

    const days = Math.max(1, Number(durationDays) || 1);
    const start = new Date(startDate || Date.now());
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    const totalPrice = product.price * days;

    // Fetch platform markup
    const markupDoc = await CategoryMarkup.findOne({ category: "instrument_rent" });
    const markupPercentage = markupDoc ? markupDoc.markupPercentage : 8;
    
    const sellerPrice = totalPrice;
    const platformCommission = totalPrice * (markupPercentage / 100);
    const productCost = totalPrice + platformCommission;

    // Determine vehicle type by listing weight
    const unitWeight = product.weightKg || 1.0;
    const weightRules = await WeightRule.find({}).sort({ minWeightKg: 1 });
    let matchedRule = weightRules.find(r => unitWeight >= r.minWeightKg && unitWeight < r.maxWeightKg);
    if (!matchedRule && weightRules.length > 0) {
      matchedRule = weightRules[weightRules.length - 1];
    }
    const vehicleType = matchedRule ? matchedRule.vehicleType : "two-wheeler";

    const newOrder = new Order({
      buyer: req.user._id,
      seller: product.owner,
      product: product._id,
      price: productCost,
      productCost: productCost,
      sellerPrice: sellerPrice,
      platformCommission: platformCommission,
      sellerEarnings: sellerPrice,
      vehicleType,
      quantity: 1,
      shippingAddress: address,
      shippingLatitude: shippingLat,
      shippingLongitude: shippingLon,
      phone: phone || req.user.phone || "9999999999",
      status: 'Pending',
      currentLocation: {
        name: "Seller Warehouse",
        latitude: product.latitude || 27.56,
        longitude: product.longitude || 80.68
      },
      isRental: true,
      rentalStartDate: start,
      rentalEndDate: end,
      rentalDurationDays: days,
      rentalReturnStatus: 'None'
    });

    await newOrder.save();
    logger.info(`Rental order placed for product ${product.title} by user ${req.user.username}`);
    res.json({ success: true, message: "Rental order placed successfully", order: newOrder });
  } catch (err) {
    next(err);
  }
};

const initiateRentalReturn = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }
    if (order.buyer.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized." });
    }
    if (!order.isRental || order.status !== "Delivered") {
      return res.status(400).json({ error: "Cannot return this order." });
    }
    
    order.rentalReturnStatus = "Return Pending";
    await order.save();
    logger.info(`Rental return initiated for Order ${order._id}`);
    res.json({ success: true, message: "Rental return initiated successfully", order });
  } catch (err) {
    next(err);
  }
};

const confirmRentalReturn = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }
    if (order.seller.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized." });
    }
    if (!order.isRental || order.rentalReturnStatus !== "Return Pending") {
      return res.status(400).json({ error: "No pending return request for this order." });
    }
    
    const actualReturnDate = new Date();
    const dueDate = order.rentalEndDate;
    let overdueCharges = 0;
    let lateDays = 0;
    
    if (actualReturnDate > dueDate) {
      const diffTime = Math.abs(actualReturnDate - dueDate);
      lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const product = await Listing.findById(order.product);
      const dailyPrice = product ? product.price : (order.price / order.rentalDurationDays);
      overdueCharges = Math.round(lateDays * dailyPrice * 1.5);
    }
    
    order.rentalReturnStatus = "Returned";
    order.status = "Returned";
    order.rentalOverdueCharges = overdueCharges;
    await order.save();
    
    try {
      const populatedOrder = await Order.findById(order._id)
        .populate("buyer", "username email")
        .populate("seller", "username email")
        .populate("product", "title");
        
      const emailService = require("../services/email.service");
      if (populatedOrder && populatedOrder.buyer && populatedOrder.seller && populatedOrder.product) {
        await emailService.sendRentalReturnConfirmationEmail(
          populatedOrder.buyer.email,
          populatedOrder.buyer.username,
          populatedOrder.seller.username,
          populatedOrder.product.title,
          lateDays,
          overdueCharges
        );
      }
    } catch (err) {
      logger.error("Failed to send rental return confirmation email: " + err.message);
    }

    logger.info(`Rental return confirmed for Order ${order._id}. Late days: ${lateDays}, charges: ${overdueCharges}`);
    res.json({ success: true, message: "Rental return confirmed successfully", order, lateDays, overdueCharges });
  } catch (err) {
    next(err);
  }
};

const previewTransporterPrice = async (sellerId, sellerLat, sellerLon, buyerLat, buyerLon, vehicleType, radius, totalWeight = 1.0) => {
  const distDelivery = Math.max(getDistanceKm(sellerLat, sellerLon, buyerLat, buyerLon), 1);
  const transporters = await User.find({ role: "transporter" });
  const candidates = [];
  
  for (const trans of transporters) {
    const transLat = trans.latitude || 27.56;
    const transLon = trans.longitude || 80.68;
    const distToSeller = getDistanceKm(transLat, transLon, sellerLat, sellerLon);
    
    if (distToSeller <= radius) {
      const matchingTypes = VEHICLE_MAPPING[vehicleType] || ["two-wheeler"];
      let vehicle = await Vehicle.findOne({
        transporter: trans._id,
        vehicleType: { $in: matchingTypes },
        isAvailable: true,
        $or: [
          { availableCount: { $exists: false } },
          { availableCount: { $gt: 0 } }
        ]
      });
      
      if (!vehicle) {
        const anyVehicle = await Vehicle.findOne({ transporter: trans._id });
        if (!anyVehicle) {
          // Determine default properties by matching type
          let pPerKm = 15;
          let mChg = 50;
          let lChg = 100;
          if (matchingTypes.includes("two-wheeler")) {
            pPerKm = 8; mChg = 20; lChg = 0;
          } else if (matchingTypes.includes("three-wheeler")) {
            pPerKm = 12; mChg = 40; lChg = 0;
          } else if (matchingTypes.includes("pickup") || matchingTypes.includes("tata-ace")) {
            pPerKm = 15; mChg = 100; lChg = 50;
          }
          
          vehicle = new Vehicle({
            transporter: trans._id,
            vehicleType: matchingTypes[0] || "two-wheeler",
            registrationNumber: "TEMP-" + trans._id.toString().substring(18).toUpperCase(),
            capacityKg: 150,
            isAvailable: true,
            pricePerKm: pPerKm,
            minCharge: mChg,
            loadingCharge: lChg
          });
          await vehicle.save();
          logger.info(`Preview seeded default vehicle for transporter: ${trans.username}`);
        } else if (anyVehicle.isAvailable && matchingTypes.includes(anyVehicle.vehicleType)) {
          vehicle = anyVehicle;
        }
      }
      
      if (vehicle && vehicle.isAvailable && matchingTypes.includes(vehicle.vehicleType)) {
        // Loading fee is waived (set to 0) if order is under 50 kg
        const loading = totalWeight < 50 ? 0 : (vehicle.loadingCharge || 0);
        const price = (vehicle.minCharge || 0) + ((vehicle.pricePerKm || 0) * distDelivery) + loading;
        
        candidates.push({
          transporter: trans._id,
          price: Math.round(price),
          distanceToSeller: Math.round(distToSeller * 10) / 10,
          distanceBuyerSeller: Math.round(distDelivery * 10) / 10
        });
      }
    }
  }
  
  candidates.sort((a, b) => a.price - b.price);
  return candidates;
};

const getCheapestTransporterPrice = async (listing, shippingLat, shippingLon, vehicleType, totalWeight = 1.0) => {
  const sellerLat = listing.latitude || 27.56;
  const sellerLon = listing.longitude || 80.68;
  
  // Try 50 KM
  let candidates = await previewTransporterPrice(listing.owner, sellerLat, sellerLon, shippingLat, shippingLon, vehicleType, 50, totalWeight);
  if (candidates.length > 0) return candidates[0].price;
  
  // Try 100 KM
  candidates = await previewTransporterPrice(listing.owner, sellerLat, sellerLon, shippingLat, shippingLon, vehicleType, 100, totalWeight);
  if (candidates.length > 0) return candidates[0].price;
  
  // Try Global
  candidates = await previewTransporterPrice(listing.owner, sellerLat, sellerLon, shippingLat, shippingLon, vehicleType, 999999, totalWeight);
  if (candidates.length > 0) return candidates[0].price;
  
  // Hard fallback with updated economical rates
  const baseCharges = {
    "two-wheeler": { min: 20, perKm: 8, loading: 0 },
    "three-wheeler": { min: 40, perKm: 12, loading: 0 },
    "pickup": { min: 100, perKm: 15, loading: 50 },
    "tata-ace": { min: 100, perKm: 15, loading: 50 },
    "mini-truck": { min: 300, perKm: 35, loading: 200 },
    "large-truck": { min: 500, perKm: 50, loading: 400 },
    "container": { min: 700, perKm: 60, loading: 500 },
    "refrigerated-truck": { min: 800, perKm: 65, loading: 500 }
  };
  const rates = baseCharges[vehicleType] || baseCharges["two-wheeler"];
  const distance = Math.max(getDistanceKm(sellerLat, sellerLon, shippingLat, shippingLon), 1);
  const loading = totalWeight < 50 ? 0 : rates.loading;
  return Math.round(rates.min + (rates.perKm * distance) + loading);
};

const getCheckoutPreview = async (req, res, next) => {
  try {
    const { address } = req.body;
    const mongoose = require("mongoose");
    
    const user = await User.findById(req.user._id).populate("cart");
    if (!user || !user.cart || user.cart.length === 0) {
      return res.json({ success: true, items: [], totalAmount: 0, deliveryTotal: 0, grandTotal: 0 });
    }
    
    let shippingLat = req.user.latitude || 27.56;
    let shippingLon = req.user.longitude || 80.68;
    const rawAddress = address || (user.address ? `${user.address.street || ""}, ${user.address.city || ""}, ${user.address.state || ""} ${user.address.pincode || ""}` : "") || "No address provided";
    
    if (address && address !== "No address provided") {
      try {
        const geocodeRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`, {
          headers: { "User-Agent": "Trishastik-AgriTech-App" }
        });
        if (geocodeRes.ok) {
          const data = await geocodeRes.json();
          if (data && data.length > 0) {
            shippingLat = Number(data[0].lat);
            shippingLon = Number(data[0].lon);
            logger.info(`Preview geocoded shipping address to: ${shippingLat}, ${shippingLon}`);
          }
        }
      } catch (err) {
        logger.error("Preview geocoding failed: " + err.message);
      }
    }
    
    // Count cart item occurrences to group them
    const productCounts = {};
    for (const item of user.cart) {
      if (item) {
        const idStr = item._id.toString();
        productCounts[idStr] = (productCounts[idStr] || 0) + 1;
      }
    }
    
    const uniqueProductIds = Object.keys(productCounts);
    const listings = await Listing.find({ _id: { $in: uniqueProductIds } }).populate("owner");
    
    // Fetch Platform Markup Configuration
    const CategoryMarkup = require("../models/categoryMarkup");
    const markups = await CategoryMarkup.find({});
    const markupMap = {};
    markups.forEach(m => {
      markupMap[m.category] = m.markupPercentage;
    });
    
    const WeightRule = require("../models/weightRule");
    const weightRules = await WeightRule.find({}).sort({ minWeightKg: 1 });
    
    const previewItems = [];
    let totalProductCost = 0;
    let totalDeliveryCharge = 0;
    
    for (const listing of listings) {
      const qty = productCounts[listing._id.toString()];
      const unitWeight = listing.weightKg || 1.0;
      const totalWeight = unitWeight * qty;
      
      // Determine Vehicle Type from rules
      let matchedRule = weightRules.find(r => totalWeight >= r.minWeightKg && totalWeight < r.maxWeightKg);
      if (!matchedRule && weightRules.length > 0) {
        matchedRule = weightRules[weightRules.length - 1]; // Fallback to highest
      }
      let vehicleType = matchedRule ? matchedRule.vehicleType : "two-wheeler";
      let vehicleDisplayName = matchedRule ? matchedRule.displayName : "Two Wheeler";
      
      // Override for Machinery / Equipment (Self-Pickup)
      if (listing.category === "instrument_rent" || listing.category === "instrument_sale") {
        vehicleType = "self-pickup";
        vehicleDisplayName = "Self-Pickup (No Delivery)";
      }
      
      // Calculate Distance
      const sellerLat = listing.latitude || 27.56;
      const sellerLon = listing.longitude || 80.68;
      const distance = Math.max(getDistanceKm(sellerLat, sellerLon, shippingLat, shippingLon), 1);
      
      // Calculate Cheapest Transporter Price
      let deliveryPrice = 0;
      if (vehicleType !== "self-pickup") {
        deliveryPrice = await getCheapestTransporterPrice(listing, shippingLat, shippingLon, vehicleType, totalWeight);
      }
      
      // Compute marked up customer price (hidden platform fee)
      const markupPercentage = markupMap[listing.category] || 5;
      const customerPrice = listing.price * (1 + (markupPercentage / 100));
      const itemTotal = customerPrice * qty;
      
      totalProductCost += itemTotal;
      totalDeliveryCharge += deliveryPrice;
      
      previewItems.push({
        listingId: listing._id,
        title: listing.title,
        image: listing.image,
        quantity: qty,
        sellerName: listing.owner ? listing.owner.fullName || listing.owner.username : "Seller",
        unitWeight,
        totalWeight,
        vehicleType,
        vehicleDisplayName,
        distance: Math.round(distance * 10) / 10,
        customerPrice: Math.round(customerPrice * 100) / 100,
        itemTotal: Math.round(itemTotal * 100) / 100,
        deliveryPrice
      });
    }
    
    res.json({
      success: true,
      items: previewItems,
      totalAmount: Math.round(totalProductCost * 100) / 100,
      deliveryTotal: totalDeliveryCharge,
      grandTotal: Math.round((totalProductCost + totalDeliveryCharge) * 100) / 100
    });
  } catch (err) {
    next(err);
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
  rentProduct,
  initiateRentalReturn,
  confirmRentalReturn,
  getCheckoutPreview,
  getCheapestTransporterPrice,
  previewTransporterPrice,
};
