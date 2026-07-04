const express = require("express");
const router = express.Router();
const listingController = require("../controllers/listing.controller");
const { isLoggedIn, authorizeRoles } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { createListingSchema } = require("../validators/listing");

router.get("/", listingController.getHomeData);
router.get("/new", isLoggedIn, listingController.checkNewListingPermission);
router.post("/new", isLoggedIn, validateBody(createListingSchema), listingController.createListing);

router.get("/seller/listings", isLoggedIn, authorizeRoles("farmer", "fertilizer_seller", "instrument_seller", "admin", "fertilizerSeller", "equipmentSeller"), listingController.getSellerListings);
router.get("/addtocart/:productid", isLoggedIn, listingController.addToCart);
router.get("/remove-from-cart/:productid", isLoggedIn, listingController.removeFromCart);
router.get("/shop", isLoggedIn, listingController.getShopData);
router.get("/listings/:id", listingController.getListingDetails);
router.delete("/listings/:id", isLoggedIn, listingController.deleteListing);

module.exports = router;
