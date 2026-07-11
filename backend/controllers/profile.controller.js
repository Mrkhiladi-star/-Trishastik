const User = require("../models/user");
const logger = require("../utils/logger");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

const checkIsProfileComplete = (user, vehicleDoc) => {
  // Common required fields
  if (!user.fullName || !user.phone) return false;
  if (!user.address || !user.address.street || !user.address.city || !user.address.state || !user.address.pincode) {
    return false;
  }
  
  // Role specific checks
  if (user.role === "farmer") {
    if (!user.landDetails || !user.landDetails.farmArea || !user.landDetails.soilType) {
      return false;
    }
  }

  if (user.role === "transporter") {
    if (!vehicleDoc) return false;
    const primaryVeh = Array.isArray(vehicleDoc) ? vehicleDoc[0] : vehicleDoc;
    if (!primaryVeh) return false;
    if (!primaryVeh.vehicleType || !primaryVeh.registrationNumber || !primaryVeh.pricePerKm) {
      return false;
    }
    if (!primaryVeh.driverDetails || !primaryVeh.driverDetails.name || !primaryVeh.driverDetails.phone || !primaryVeh.driverDetails.licenseNumber) {
      return false;
    }
  }
  return true;
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("cart").populate("order");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { fullName, phone, address, farmingInfo, landDetails, latitude, longitude } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    
    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    // Use coordinates if specifically provided (via GPS Autofill) and they aren't the default placeholder
    if (latitude !== undefined && latitude !== 27.56) user.latitude = Number(latitude);
    if (longitude !== undefined && longitude !== 80.68) user.longitude = Number(longitude);
    
    if (address) {
      user.address = { ...user.address, ...address };
      
      // If coordinates are missing or still set to defaults, geocode the updated text address!
      const finalLat = (latitude !== undefined && latitude !== 27.56) ? Number(latitude) : user.latitude;
      const finalLon = (longitude !== undefined && longitude !== 80.68) ? Number(longitude) : user.longitude;
      
      if (!finalLat || !finalLon || finalLat === 27.56 || finalLon === 80.68) {
        try {
          const query = [address.street, address.city, address.state, address.pincode].filter(Boolean).join(", ");
          if (query) {
            const geocodeRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`, {
              headers: { "User-Agent": "Trishastik-AgriTech-App" }
            });
            if (geocodeRes.ok) {
              const data = await geocodeRes.json();
              if (data && data.length > 0) {
                user.latitude = Number(data[0].lat);
                user.longitude = Number(data[0].lon);
                user.address.latitude = Number(data[0].lat);
                user.address.longitude = Number(data[0].lon);
                logger.info(`Geocoded manual address "${query}" to coordinates: ${data[0].lat}, ${data[0].lon}`);
              }
            }
          }
        } catch (err) {
          logger.error("Failed to geocode manual address during profile update:", err.message);
        }
      } else {
        // Synchronize address coords with top-level coords if coordinates were successfully set
        user.address.latitude = user.latitude;
        user.address.longitude = user.longitude;
      }
    }
    if (farmingInfo) {
      user.farmingInfo = { ...user.farmingInfo, ...farmingInfo };
    }
    if (landDetails) {
      user.landDetails = { ...user.landDetails, ...landDetails };
    }

    // Evaluate profile completeness
    const Vehicle = require("../models/vehicle");
    let vehicleDoc = null;
    if (user.role === "transporter") {
      vehicleDoc = await Vehicle.findOne({ transporter: user._id });
    }
    user.isProfileComplete = checkIsProfileComplete(user, vehicleDoc);

    await user.save();
    logger.info(`Profile updated for user: ${user.username}. Completeness status: ${user.isProfileComplete}`);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

const updatePhoto = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    
    if (req.file) {
      const uploadToCloudinary = () =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "trishastik/profile-photos",
              resource_type: "auto"
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });

      const result = await uploadToCloudinary();
      user.profilePhoto = result.secure_url;
    } else if (req.body.photo) {
      const result = await cloudinary.uploader.upload(req.body.photo, {
        folder: "trishastik/profile-photos",
        resource_type: "auto"
      });
      user.profilePhoto = result.secure_url;
    }
    
    await user.save();
    logger.info(`Profile photo updated for user: ${user.username}`);
    res.json({ success: true, profilePhoto: user.profilePhoto });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Old and new passwords are required." });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    await user.changePassword(oldPassword, newPassword);
    logger.info(`Password successfully updated for user: ${user.username}`);
    res.json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to change password." });
  }
};

const getVehicle = async (req, res, next) => {
  try {
    if (req.user.role !== "transporter") {
      return res.status(403).json({ error: "Access denied. Only transporters have vehicles." });
    }
    const Vehicle = require("../models/vehicle");
    const vehicles = await Vehicle.find({ transporter: req.user._id });
    let defaultVehicle = vehicles[0];
    if (!defaultVehicle) {
      defaultVehicle = new Vehicle({
        transporter: req.user._id,
        vehicleType: "two-wheeler",
        registrationNumber: "TEMP-" + req.user._id.toString().substring(18).toUpperCase(),
        capacityKg: 500,
        isAvailable: true,
        availableCount: 1,
        pricePerKm: 15,
        minCharge: 50,
        loadingCharge: 100
      });
      await defaultVehicle.save();
      vehicles.push(defaultVehicle);
    }
    res.json({ success: true, vehicle: defaultVehicle, vehicles });
  } catch (err) {
    next(err);
  }
};

const addVehicle = async (req, res, next) => {
  try {
    if (req.user.role !== "transporter") {
      return res.status(403).json({ error: "Access denied. Only transporters have vehicles." });
    }
    const {
      vehicleType,
      registrationNumber,
      capacityKg,
      isAvailable,
      availableCount,
      pricePerKm,
      minCharge,
      loadingCharge,
      waitingCharge,
      nightSurcharge,
      driverName,
      driverPhone,
      driverLicense
    } = req.body;

    const Vehicle = require("../models/vehicle");
    const vehicle = new Vehicle({
      transporter: req.user._id,
      vehicleType: vehicleType || "two-wheeler",
      registrationNumber: registrationNumber || "TEMP-" + Math.floor(1000 + Math.random() * 9000),
      capacityKg: Number(capacityKg) || 150,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      availableCount: Number(availableCount) || 1,
      pricePerKm: Number(pricePerKm) || 15,
      minCharge: Number(minCharge) || 50,
      loadingCharge: Number(loadingCharge) || 100,
      waitingCharge: Number(waitingCharge) || 50,
      nightSurcharge: Number(nightSurcharge) || 0,
      driverDetails: {
        name: driverName || "",
        phone: driverPhone || "",
        licenseNumber: driverLicense || ""
      }
    });

    await vehicle.save();

    // Re-evaluate profile completeness
    const user = await User.findById(req.user._id);
    const allVehicles = await Vehicle.find({ transporter: req.user._id });
    user.isProfileComplete = checkIsProfileComplete(user, allVehicles);
    await user.save();

    res.json({ success: true, vehicle, vehicles: allVehicles });
  } catch (err) {
    next(err);
  }
};

const updateVehicle = async (req, res, next) => {
  try {
    if (req.user.role !== "transporter") {
      return res.status(403).json({ error: "Access denied. Only transporters have vehicles." });
    }
    const {
      id,
      vehicleType,
      registrationNumber,
      capacityKg,
      isAvailable,
      availableCount,
      pricePerKm,
      minCharge,
      loadingCharge,
      waitingCharge,
      nightSurcharge,
      driverName,
      driverPhone,
      driverLicense
    } = req.body;

    const Vehicle = require("../models/vehicle");
    let vehicle;
    const vehicleId = id || req.params.id;
    if (vehicleId) {
      vehicle = await Vehicle.findOne({ _id: vehicleId, transporter: req.user._id });
    } else {
      vehicle = await Vehicle.findOne({ transporter: req.user._id });
    }

    if (!vehicle) {
      vehicle = new Vehicle({ transporter: req.user._id });
    }

    if (vehicleType !== undefined) vehicle.vehicleType = vehicleType;
    if (registrationNumber !== undefined) vehicle.registrationNumber = registrationNumber;
    if (capacityKg !== undefined) vehicle.capacityKg = Number(capacityKg);
    if (isAvailable !== undefined) vehicle.isAvailable = isAvailable;
    if (availableCount !== undefined) vehicle.availableCount = Number(availableCount);
    if (pricePerKm !== undefined) vehicle.pricePerKm = Number(pricePerKm);
    if (minCharge !== undefined) vehicle.minCharge = Number(minCharge);
    if (loadingCharge !== undefined) vehicle.loadingCharge = Number(loadingCharge);
    if (waitingCharge !== undefined) vehicle.waitingCharge = Number(waitingCharge);
    if (nightSurcharge !== undefined) vehicle.nightSurcharge = Number(nightSurcharge);
    
    if (!vehicle.driverDetails) vehicle.driverDetails = {};
    if (driverName !== undefined) vehicle.driverDetails.name = driverName;
    if (driverPhone !== undefined) vehicle.driverDetails.phone = driverPhone;
    if (driverLicense !== undefined) vehicle.driverDetails.licenseNumber = driverLicense;

    await vehicle.save();

    // Re-evaluate profile completeness
    const user = await User.findById(req.user._id);
    const allVehicles = await Vehicle.find({ transporter: req.user._id });
    user.isProfileComplete = checkIsProfileComplete(user, allVehicles);
    await user.save();

    res.json({ success: true, vehicle, vehicles: allVehicles });
  } catch (err) {
    next(err);
  }
};

const deleteVehicle = async (req, res, next) => {
  try {
    if (req.user.role !== "transporter") {
      return res.status(403).json({ error: "Access denied. Only transporters have vehicles." });
    }
    const Vehicle = require("../models/vehicle");
    const deleted = await Vehicle.findOneAndDelete({ _id: req.params.id, transporter: req.user._id });
    if (!deleted) {
      return res.status(404).json({ error: "Vehicle not found." });
    }

    // Re-evaluate profile completeness
    const user = await User.findById(req.user._id);
    const allVehicles = await Vehicle.find({ transporter: req.user._id });
    user.isProfileComplete = checkIsProfileComplete(user, allVehicles);
    await user.save();

    res.json({ success: true, message: "Vehicle deleted successfully.", vehicles: allVehicles });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updatePhoto,
  changePassword,
  getVehicle,
  addVehicle,
  updateVehicle,
  deleteVehicle
};
