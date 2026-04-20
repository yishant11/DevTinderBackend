const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["ignored", "interested", "accepted", "rejected"],
      default: "ignored",
    },
  },
  {
    timestamps: true,
  }
);

// ye check tum 
connectionRequestSchema.pre("save", function() {
    const fromUserId = this.fromUserId;
    const toUserId = this.toUserId;
    if (fromUserId.equals(toUserId)) {
        throw new Error("Cannot send connection request to yourself");
    }
});

const ConnectionRequest = mongoose.model("ConnectionRequest", connectionRequestSchema);

module.exports = ConnectionRequest;
