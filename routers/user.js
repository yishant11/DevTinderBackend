const express = require("express");
const userRouter = express.Router();
const { auth } = require("../middleware/auth");
const ConnectionRequest = require("../src/model/ConnectionRequest");
const User = require("../src/model/User");
const mongoose = require("mongoose");

// GET/USERS/CONNECTION - > GETTING ALL THE PENDING CONNECTION REQUEST FOR LOGGED IN USER

userRouter.get("/requests/received", auth, async (req, res) => {
  try {
    const loggedInUser = req.user._id;

    const connectionrequest = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate({
      path: "fromUserId",
      select: "firstName lastName",
    });

    res.json({
      success: true,
      data: connectionrequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET THE LIST OF USERS WHO HAS ACCEPTED MY REQUEST

userRouter.get("/connection", auth, async (req, res) => {
  try {
    const loggedInUser = req.user._id;

    const connectionrequests = await ConnectionRequest.find({
      $or: [
        { toUserId: loggedInUser._id, status: "accepted" },
        { fromUserId: loggedInUser._id, status: "accepted" },
      ],
    })
      .populate("fromUserId", "firstName lastName ")
      .populate("toUserId", "firstName lastName ");

    const data = connectionrequests.map((row) => {
      if (row.fromUserId._id.toString() === loggedInUser.toString()) {
        return row.toUserId;
      }
      return row.fromUserId;
    });

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// feed api vvvvvvvvvvvvvvimp

userRouter.get("/feed", auth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // ✅ pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { fromUserId: loggedInUserId },
        { toUserId: loggedInUserId },
      ],
    }).select("fromUserId toUserId");

    const hideUsersFromFeed = new Set();

    connectionRequests.forEach((request) => {
      hideUsersFromFeed.add(request.fromUserId.toString());
      hideUsersFromFeed.add(request.toUserId.toString());
    });

    const users = await User.find({
      _id: {
        $nin: [...hideUsersFromFeed, loggedInUserId.toString()],
      },
    })
      .select("firstName lastName")
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      page,
      limit,
      count: users.length,
      data: users,
    });

  } catch (error) {
    console.error("Feed API Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = userRouter;
