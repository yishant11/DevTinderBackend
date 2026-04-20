const express = require("express");
const profileRouter = express.Router();
const { validateEditProfile } = require("../utils/validate");
const { auth } = require("../middleware/auth");
const User = require("../src/model/User");
const bcrypt = require("bcrypt");

// GET user profile
profileRouter.get("/getprofile", auth, async (req, res) => {
  try {
    // Remove password from response
    const userResponse = req.user.toObject();
    delete userResponse.password;
    res.send(userResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PATCH update profile
profileRouter.patch("/edit", auth, async (req, res) => {
  try {
    // Validate edit profile data
    const isValid = validateEditProfile(req);
    if(!isValid){
      return res.status(400).json({ message: "Invalid profile data" });
    }
    
    const userId = req.user._id;
    const updateData = {};
    
    // Only update fields that are provided
    Object.keys(req.body).forEach((key) => {
      updateData[key] = req.body[key];
    });
    
    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    console.log("Updated user:", updatedUser);
    res.json({ 
      message: `${updatedUser.firstName} profile updated successfully`,
      user: updatedUser 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Profile update failed", error: error.message });
  }
});

// PATCH update password (change password)
profileRouter.patch("/change-password", auth, async (req, res) => {
  try {
    // Validate password data
    if(!req.body.password){
      return res.status(400).json({ message: "Password is required" });
    }
    
    const userId = req.user._id;
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    
    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { password: hashedPassword }, 
      { new: true, runValidators: true }
    );
    
    console.log("Password updated for user:", updatedUser.email);
    res.json({ 
      message: `${updatedUser.firstName} password updated successfully`,
      user: {
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        email: updatedUser.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Password update failed", error: error.message });
  }
});

module.exports = profileRouter;