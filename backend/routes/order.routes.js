const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const { isLoggedIn, authorizeRoles } = require("../middleware/auth");

router.get("/checkout", isLoggedIn, orderController.getCheckout);
router.post("/checkout", isLoggedIn, orderController.checkout);
router.get("/orders", isLoggedIn, orderController.getBuyerOrders);
router.get("/seller/orders", isLoggedIn, orderController.getSellerOrders);

// Transporter routes
router.get("/transporter/jobs", isLoggedIn, authorizeRoles("transporter", "admin"), orderController.getTransporterJobs);
router.get("/transporter/active", isLoggedIn, authorizeRoles("transporter", "admin"), orderController.getTransporterActive);

// Seller/Transporter tracking updates
router.post("/orders/:id/accept", isLoggedIn, orderController.sellerAcceptOrder);
router.post("/orders/:id/request-transit", isLoggedIn, orderController.sellerRequestTransit);
router.post("/orders/:id/accept-delivery", isLoggedIn, authorizeRoles("transporter", "admin"), orderController.transporterAcceptDelivery);
router.post("/orders/:id/reject-delivery", isLoggedIn, authorizeRoles("transporter", "admin"), orderController.transporterRejectDelivery);
router.post("/orders/:id/track", isLoggedIn, orderController.trackOrder);
router.post("/orders/:id/cancel", isLoggedIn, orderController.cancelOrder);
router.post("/orders/:id/review", isLoggedIn, orderController.reviewOrder);

// Admin / checkout registry view
router.get("/customer", isLoggedIn, authorizeRoles("admin", "farmer", "fertilizer_seller", "instrument_seller", "fertilizerSeller", "equipmentSeller"), orderController.getCustomersCheckout);

// Listing reviews
router.post("/newReview", isLoggedIn, orderController.createListingReview);

// Rental routes
router.post("/orders/rent", isLoggedIn, orderController.rentProduct);
router.post("/orders/:id/initiate-return", isLoggedIn, orderController.initiateRentalReturn);
router.post("/orders/:id/confirm-return", isLoggedIn, orderController.confirmRentalReturn);

module.exports = router;
