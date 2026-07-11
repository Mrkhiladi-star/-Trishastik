const WeightRule = require("../models/weightRule");
const CategoryMarkup = require("../models/categoryMarkup");
const PaymentSession = require("../models/paymentSession");
const Order = require("../models/order");
const logger = require("../utils/logger");

// Weight Rules CRUD
const getWeightRules = async (req, res, next) => {
  try {
    const rules = await WeightRule.find({}).sort({ minWeightKg: 1 });
    res.json({ success: true, rules });
  } catch (err) {
    next(err);
  }
};

const createWeightRule = async (req, res, next) => {
  try {
    const { minWeightKg, maxWeightKg, vehicleType, displayName } = req.body;
    const rule = new WeightRule({ minWeightKg, maxWeightKg, vehicleType, displayName });
    await rule.save();
    logger.info(`Admin created WeightRule: ${displayName}`);
    res.json({ success: true, rule });
  } catch (err) {
    next(err);
  }
};

const updateWeightRule = async (req, res, next) => {
  try {
    const { minWeightKg, maxWeightKg, vehicleType, displayName } = req.body;
    const rule = await WeightRule.findByIdAndUpdate(
      req.params.id,
      { minWeightKg, maxWeightKg, vehicleType, displayName },
      { new: true }
    );
    if (!rule) return res.status(404).json({ error: "Weight rule not found." });
    logger.info(`Admin updated WeightRule: ${displayName}`);
    res.json({ success: true, rule });
  } catch (err) {
    next(err);
  }
};

const deleteWeightRule = async (req, res, next) => {
  try {
    const rule = await WeightRule.findByIdAndDelete(req.params.id);
    if (!rule) return res.status(404).json({ error: "Weight rule not found." });
    logger.info(`Admin deleted WeightRule ID: ${req.params.id}`);
    res.json({ success: true, message: "Rule deleted successfully." });
  } catch (err) {
    next(err);
  }
};

// Markup Management
const getMarkups = async (req, res, next) => {
  try {
    const markups = await CategoryMarkup.find({});
    res.json({ success: true, markups });
  } catch (err) {
    next(err);
  }
};

const updateMarkup = async (req, res, next) => {
  try {
    const { markupPercentage } = req.body;
    const markup = await CategoryMarkup.findByIdAndUpdate(
      req.params.id,
      { markupPercentage },
      { new: true }
    );
    if (!markup) return res.status(404).json({ error: "Category markup not found." });
    logger.info(`Admin updated markup for ${markup.category} to ${markupPercentage}%`);
    res.json({ success: true, markup });
  } catch (err) {
    next(err);
  }
};

// Finance Report
const getFinanceReport = async (req, res, next) => {
  try {
    const orders = await Order.find({ status: { $ne: "Cancelled" } })
      .populate("buyer", "username email")
      .populate("seller", "username email")
      .populate("product", "title");

    const totalTransactions = orders.length;
    let totalGrossSales = 0;
    let totalCommissions = 0;
    let totalPayouts = 0;

    const ledger = orders.map(order => {
      const gross = order.price || 0;
      const commission = order.platformCommission || 0;
      const netPayout = order.sellerEarnings || 0;
      
      totalGrossSales += gross;
      totalCommissions += commission;
      totalPayouts += netPayout;

      return {
        orderId: order._id,
        date: order.createdAt,
        buyer: order.buyer ? order.buyer.username : "Buyer",
        seller: order.seller ? order.seller.username : "Seller",
        product: order.product ? order.product.title : "Product",
        gross,
        commission,
        netPayout,
        status: order.status,
        settlementStatus: order.settlementStatus
      };
    });

    res.json({
      success: true,
      summary: {
        totalTransactions,
        totalGrossSales: Math.round(totalGrossSales * 100) / 100,
        totalCommissions: Math.round(totalCommissions * 100) / 100,
        totalPayouts: Math.round(totalPayouts * 100) / 100
      },
      ledger
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWeightRules,
  createWeightRule,
  updateWeightRule,
  deleteWeightRule,
  getMarkups,
  updateMarkup,
  getFinanceReport
};
