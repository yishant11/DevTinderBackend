const express = require("express");
const connectionRequestRouter = express.Router();
const { auth } = require("../middleware/auth");
const ConnectionRequest = require("../src/model/ConnectionRequest");
const User = require("../src/model/User");
const  sendEmail  = require("../utils/sendEmail");

// POST connection request
connectionRequestRouter.post(
  "/send/:status/:toUserId",
  auth,
  async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const toUserId = req.params.toUserId;
      const status = req.params.status;

      // validation
      const allowedStatuses = ["ignored", "interested"];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      // if there is already a connection request then return error
      const existingRequest = await ConnectionRequest.findOne({
        $or: [
          //Kya user A ne user B ko request bheji hai?
          { fromUserId, toUserId },
          //Kya user B ne pehle hi user A ko request bhej di?
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });

      if (existingRequest) {
        return res
          .status(400)
          .json({ error: "Connection request already exists" });
      }

      const touser = await User.findOne({ _id: toUserId });
      if (!touser) {
        return res.status(400).json({ error: "User not found" });
      }

      // if(touser._id.toString() === fromUserId.toString()){
      //   return res.status(400).json({ error: "You cannot send connection request to yourself" });
      // }

      const connectionRequest = new ConnectionRequest({
        fromUserId,
        toUserId,
        status,
      });
      
      await connectionRequest.save();
      
      // Send email notification
      const emailResult = await sendEmail.run(`GOT NEW FRIEND REQUEST FROM ${req.user.firstName.toUpperCase()} ${req.user.lastName.toUpperCase()}`, `Hello ${touser.firstName},\n\n${req.user.firstName} ${req.user.lastName} has sent you a friend request.\n\nPlease log in to your account to review the request.`);
      console.log("Email sent successfully", emailResult);
      
      res.status(201).json({
        message: "Connection request sent successfully",
        connectionRequest,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// POST accept/reject connection request
connectionRequestRouter.post(
  "/review/:status/:requestId",
  auth,
  async (req, res) => {
    try {
      const loggedInUser = req.user;
      const requestId = req.params.requestId;
      const status = req.params.status;

      // validation
      const allowedStatuses = ["accepted", "rejected"];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: "status not allowed" });
      }


      // if there is already a connection request then return error
      const Connectionrequest = await ConnectionRequest.findOne({
        _id: requestId,
        toUserId: loggedInUser._id,
        status: "interested",
      });

      console.log("Review Request - Found Connection:", Connectionrequest);

      if (!Connectionrequest) {
        return res.status(400).json({ error: "Connection request not found" });
      }

      Connectionrequest.status = status;
      await Connectionrequest.save();
      res.status(201).json({
        message: `${status} connection request`,
        connectionRequest: Connectionrequest,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

module.exports = connectionRequestRouter;

