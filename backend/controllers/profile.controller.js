const User = require("../models/user");
const logger = require("../utils/logger");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

const checkIsProfileComplete = (user) => {
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
    const { fullName, phone, address, farmingInfo, landDetails } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    
    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (address) {
      user.address = { ...user.address, ...address };
    }
    if (farmingInfo) {
      user.farmingInfo = { ...user.farmingInfo, ...farmingInfo };
    }
    if (landDetails) {
      user.landDetails = { ...user.landDetails, ...landDetails };
    }

    // Evaluate profile completeness
    user.isProfileComplete = checkIsProfileComplete(user);

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

module.exports = {
  getProfile,
  updateProfile,
  updatePhoto,
  changePassword,
};
