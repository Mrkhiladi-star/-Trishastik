const Razorpay = require("razorpay");
const PaymentSession = require("../models/paymentSession");
const Order = require("../models/order");
const Listing = require("../models/listing");
const User = require("../models/user");
const CategoryMarkup = require("../models/categoryMarkup");
const WeightRule = require("../models/weightRule");
const logger = require("../utils/logger");
const crypto = require("crypto");
const { getDistanceKm } = require("../utils/distance");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "key_secret_placeholder"
});

const initiatePayment = async (req, res, next) => {
  try {
    const { address, phone, fullName } = req.body;
    const user = await User.findById(req.user._id).populate("cart");
    if (!user || !user.cart || user.cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty." });
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
          }
        }
      } catch (err) {
        logger.error("Initiate geocoding failed: " + err.message);
      }
    }
    
    // Group items for quantity count
    const productCounts = {};
    for (const item of user.cart) {
      if (item) {
        const idStr = item._id.toString();
        productCounts[idStr] = (productCounts[idStr] || 0) + 1;
      }
    }
    
    const uniqueProductIds = Object.keys(productCounts);
    const listings = await Listing.find({ _id: { $in: uniqueProductIds } }).populate("owner");
    
    // Fetch platform markups
    const markups = await CategoryMarkup.find({});
    const markupMap = {};
    markups.forEach(m => {
      markupMap[m.category] = m.markupPercentage;
    });
    
    const weightRules = await WeightRule.find({}).sort({ minWeightKg: 1 });
    
    let totalProductCost = 0;
    let totalDeliveryCharge = 0;
    
    const orderController = require("./order.controller");
    
    for (const listing of listings) {
      const qty = productCounts[listing._id.toString()];
      const unitWeight = listing.weightKg || 1.0;
      const totalWeight = unitWeight * qty;
      
      let matchedRule = weightRules.find(r => totalWeight >= r.minWeightKg && totalWeight < r.maxWeightKg);
      if (!matchedRule && weightRules.length > 0) {
        matchedRule = weightRules[weightRules.length - 1];
      }
      let vehicleType = matchedRule ? matchedRule.vehicleType : "two-wheeler";
      
      // Override for Machinery / Equipment (Self-Pickup)
      if (listing.category === "instrument_rent" || listing.category === "instrument_sale") {
        vehicleType = "self-pickup";
      }

      let deliveryPrice = 0;
      if (vehicleType !== "self-pickup") {
        deliveryPrice = await orderController.getCheapestTransporterPrice(listing, shippingLat, shippingLon, vehicleType, totalWeight);
      }
      
      const markupPercentage = markupMap[listing.category] || 5;
      const customerPrice = listing.price * (1 + (markupPercentage / 100));
      const itemTotal = customerPrice * qty;
      
      totalProductCost += itemTotal;
      totalDeliveryCharge += deliveryPrice;
    }
    
    const grandTotalINR = Math.round((totalProductCost + totalDeliveryCharge) * 100) / 100;
    const amountInPaise = Math.round(grandTotalINR * 100);
    
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };
    
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create(options);
    } catch (rzpErr) {
      logger.error("Razorpay order creation failed. Verify that RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are correctly defined in backend/.env: " + rzpErr.message, rzpErr);
      return res.status(401).json({
        error: "Payment gateway initialization failed. Please write valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your backend/.env file."
      });
    }
    
    const paymentSession = new PaymentSession({
      buyer: req.user._id,
      razorpayOrderId: razorpayOrder.id,
      amountPaid: grandTotalINR,
      status: "Created"
    });
    await paymentSession.save();
    
    res.json({
      success: true,
      key_id: process.env.RAZORPAY_KEY_ID,
      razorpayOrder,
      session: {
        id: paymentSession._id,
        amount: grandTotalINR
      },
      metadata: {
        fullName,
        address: rawAddress,
        phone,
        shippingLat,
        shippingLon
      }
    });
  } catch (err) {
    next(err);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, metadata } = req.body;
    
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");
      
    if (expectedSignature !== razorpay_signature) {
      logger.error("Payment signature mismatch. Verification failed.");
      return res.status(400).json({ error: "Payment signature mismatch." });
    }
    
    const paymentSession = await PaymentSession.findOne({ razorpayOrderId: razorpay_order_id });
    if (!paymentSession) {
      return res.status(404).json({ error: "Payment session not found." });
    }
    
    if (paymentSession.status === "Paid") {
      const user = await User.findById(req.user._id);
      return res.json({
        success: true,
        message: "Payment already processed.",
        user: {
          username: user.username,
          email: user.email,
          role: user.role,
          cart: user.cart,
          order: user.order
        }
      });
    }
    
    paymentSession.status = "Paid";
    paymentSession.razorpayPaymentId = razorpay_payment_id;
    
    const user = await User.findById(req.user._id).populate("cart");
    const productCounts = {};
    for (const item of user.cart) {
      if (item) {
        const idStr = item._id.toString();
        productCounts[idStr] = (productCounts[idStr] || 0) + 1;
      }
    }
    
    const uniqueProductIds = Object.keys(productCounts);
    const listings = await Listing.find({ _id: { $in: uniqueProductIds } }).populate("owner");
    
    const CategoryMarkup = require("../models/categoryMarkup");
    const markups = await CategoryMarkup.find({});
    const markupMap = {};
    markups.forEach(m => {
      markupMap[m.category] = m.markupPercentage;
    });
    
    const WeightRule = require("../models/weightRule");
    const weightRules = await WeightRule.find({}).sort({ minWeightKg: 1 });
    
    const orderController = require("./order.controller");
    
    const createdOrders = [];
    const shippingLat = metadata.shippingLat || 27.56;
    const shippingLon = metadata.shippingLon || 80.68;
    const rawAddress = metadata.address || "No address provided";
    
    for (const listing of listings) {
      const qty = productCounts[listing._id.toString()];
      const unitWeight = listing.weightKg || 1.0;
      const totalWeight = unitWeight * qty;
      
      let matchedRule = weightRules.find(r => totalWeight >= r.minWeightKg && totalWeight < r.maxWeightKg);
      if (!matchedRule && weightRules.length > 0) {
        matchedRule = weightRules[weightRules.length - 1];
      }
      let vehicleType = matchedRule ? matchedRule.vehicleType : "two-wheeler";
      
      // Override for Machinery / Equipment (Self-Pickup)
      if (listing.category === "instrument_rent" || listing.category === "instrument_sale") {
        vehicleType = "self-pickup";
      }

      let deliveryPrice = 0;
      if (vehicleType !== "self-pickup") {
        deliveryPrice = await orderController.getCheapestTransporterPrice(listing, shippingLat, shippingLon, vehicleType, totalWeight);
      }
      
      const markupPercentage = markupMap[listing.category] || 5;
      const customerPrice = listing.price * (1 + (markupPercentage / 100));
      const productCost = Math.round(customerPrice * qty * 100) / 100;
      const sellerPrice = listing.price * qty;
      
      const platformCommission = Math.round((productCost - sellerPrice) * 100) / 100;
      
      const newOrder = new Order({
        buyer: req.user._id,
        seller: listing.owner._id,
        product: listing._id,
        price: productCost,
        quantity: qty,
        shippingAddress: rawAddress,
        shippingLatitude: shippingLat,
        shippingLongitude: shippingLon,
        phone: metadata.phone || req.user.phone || "9999999999",
        status: 'Pending',
        currentLocation: {
          name: "Seller Warehouse",
          latitude: listing.latitude || 27.56,
          longitude: listing.longitude || 80.68
        },
        vehicleType,
        deliveryPrice,
        paymentSession: paymentSession._id,
        productCost,
        sellerPrice,
        platformCommission,
        sellerEarnings: sellerPrice,
        transporterEarnings: deliveryPrice,
        settlementStatus: 'Pending Settle'
      });
      
      await newOrder.save();
      createdOrders.push(newOrder._id);
    }
    
    paymentSession.orders = createdOrders;
    await paymentSession.save();
    
    user.order = [...user.order, ...listings.map(l => l._id)];
    user.cart = [];
    await user.save();
    
    logger.info(`Payment verified successfully for user ${user.username}. Session: ${paymentSession._id}`);
    
    res.json({
      success: true,
      message: "Order placed successfully.",
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

const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const webhookBody = JSON.stringify(req.body);
    
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || "")
      .update(webhookBody)
      .digest("hex");
      
    if (expectedSignature !== signature) {
      logger.warn("Webhook validation failed. Signature mismatch.");
      return res.status(400).json({ error: "Invalid signature" });
    }
    
    const event = req.body.event;
    logger.info(`Received Webhook event: ${event}`);
    
    if (event === "order.paid") {
      const orderEntity = req.body.payload.order.entity;
      const razorpayOrderId = orderEntity.id;
      
      const paymentSession = await PaymentSession.findOne({ razorpayOrderId });
      if (!paymentSession) {
        logger.warn(`No PaymentSession found for razorpayOrderId: ${razorpayOrderId}`);
        return res.json({ success: false, message: "No session found" });
      }
      
      if (paymentSession.status === "Paid") {
        logger.info(`PaymentSession ${paymentSession._id} already marked Paid.`);
        return res.json({ success: true, message: "Already processed" });
      }
      
      paymentSession.status = "Paid";
      const payments = req.body.payload.payment?.entity;
      if (payments) {
        paymentSession.razorpayPaymentId = payments.id;
      }
      
      if (paymentSession.orders && paymentSession.orders.length > 0) {
        logger.info(`Orders already created for session: ${paymentSession._id}`);
        await paymentSession.save();
        return res.json({ success: true, message: "Orders already exist" });
      }
      
      const buyer = await User.findById(paymentSession.buyer).populate("cart");
      if (!buyer) {
        logger.error(`Buyer ${paymentSession.buyer} not found in database.`);
        return res.status(404).json({ error: "Buyer not found" });
      }
      
      if (buyer.cart && buyer.cart.length > 0) {
        const productCounts = {};
        for (const item of buyer.cart) {
          if (item) {
            const idStr = item._id.toString();
            productCounts[idStr] = (productCounts[idStr] || 0) + 1;
          }
        }
        
        const uniqueProductIds = Object.keys(productCounts);
        const listings = await Listing.find({ _id: { $in: uniqueProductIds } }).populate("owner");
        
        const CategoryMarkup = require("../models/categoryMarkup");
        const markups = await CategoryMarkup.find({});
        const markupMap = {};
        markups.forEach(m => {
          markupMap[m.category] = m.markupPercentage;
        });
        
        const WeightRule = require("../models/weightRule");
        const weightRules = await WeightRule.find({}).sort({ minWeightKg: 1 });
        
        const orderController = require("./order.controller");
        
        const createdOrders = [];
        const shippingLat = buyer.latitude || 27.56;
        const shippingLon = buyer.longitude || 80.68;
        const rawAddress = buyer.address ? `${buyer.address.street || ""}, ${buyer.address.city || ""}, ${buyer.address.state || ""} ${buyer.address.pincode || ""}` : "No address provided";
        
        for (const listing of listings) {
          const qty = productCounts[listing._id.toString()];
          const unitWeight = listing.weightKg || 1.0;
          const totalWeight = unitWeight * qty;
          
          let matchedRule = weightRules.find(r => totalWeight >= r.minWeightKg && totalWeight < r.maxWeightKg);
          if (!matchedRule && weightRules.length > 0) {
            matchedRule = weightRules[weightRules.length - 1];
          }
          let vehicleType = matchedRule ? matchedRule.vehicleType : "two-wheeler";
          
          // Override for Machinery / Equipment (Self-Pickup)
          if (listing.category === "instrument_rent" || listing.category === "instrument_sale") {
            vehicleType = "self-pickup";
          }

          let deliveryPrice = 0;
          if (vehicleType !== "self-pickup") {
            deliveryPrice = await orderController.getCheapestTransporterPrice(listing, shippingLat, shippingLon, vehicleType, totalWeight);
          }
          
          const markupPercentage = markupMap[listing.category] || 5;
          const customerPrice = listing.price * (1 + (markupPercentage / 100));
          const productCost = Math.round(customerPrice * qty * 100) / 100;
          const sellerPrice = listing.price * qty;
          
          const platformCommission = Math.round((productCost - sellerPrice) * 100) / 100;
          
          const newOrder = new Order({
            buyer: buyer._id,
            seller: listing.owner._id,
            product: listing._id,
            price: productCost,
            quantity: qty,
            shippingAddress: rawAddress,
            shippingLatitude: shippingLat,
            shippingLongitude: shippingLon,
            phone: buyer.phone || "9999999999",
            status: 'Pending',
            currentLocation: {
              name: "Seller Warehouse",
              latitude: listing.latitude || 27.56,
              longitude: listing.longitude || 80.68
            },
            vehicleType,
            deliveryPrice,
            paymentSession: paymentSession._id,
            productCost,
            sellerPrice,
            platformCommission,
            sellerEarnings: sellerPrice,
            transporterEarnings: deliveryPrice,
            settlementStatus: 'Pending Settle'
          });
          
          await newOrder.save();
          createdOrders.push(newOrder._id);
        }
        
        paymentSession.orders = createdOrders;
        buyer.order = [...buyer.order, ...listings.map(l => l._id)];
        buyer.cart = [];
        await buyer.save();
        logger.info(`Webhook created backup orders for user: ${buyer.username}`);
      }
      
      await paymentSession.save();
    } else if (event === "refund.processed") {
      const refundEntity = req.body.payload.refund.entity;
      const razorpayOrderId = refundEntity.order_id;
      
      const paymentSession = await PaymentSession.findOne({ razorpayOrderId });
      if (paymentSession) {
        paymentSession.status = "Refunded";
        await paymentSession.save();
        
        if (paymentSession.orders && paymentSession.orders.length > 0) {
          await Order.updateMany(
            { _id: { $in: paymentSession.orders } },
            { $set: { status: "Cancelled", settlementStatus: "Refunded" } }
          );
          logger.info(`Webhook processed refund: Cancelled orders for PaymentSession ${paymentSession._id}`);
        }
      }
    }
    
    res.json({ status: "ok" });
  } catch (err) {
    logger.error("Error processing webhook: " + err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  initiatePayment,
  verifyPayment,
  handleRazorpayWebhook
};
