const express = require("express");
const { auth } = require("../middleware/auth");
const razorpay = require("../utils/razorpay");
const Payment = require("../src/model/paymentSchema");
const User = require("../src/model/User.js");
const { membership_amount } = require("../utils/constants");
const PaymentRouter = express.Router();
const {
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");

PaymentRouter.post("/create-order", auth, async (req, res) => {
  try {
    const { membership_type, membershipType } = req.body;
    const type = membership_type || membershipType;
    const { firstName, lastName, email } = req.user;

    const options = {
      amount: membership_amount[type] * 100,
      currency: "INR",
      receipt: "order_rcptid_11",
      notes: {
        first_name: firstName,
        last_name: lastName,
        email: email,
        membership_type: type,
      },
    };

    const order = await razorpay.orders.create(options);

    console.log("Order:", order);

    const paymentRecord = new Payment({
      orderId: order.id,
      userId: req.user._id,
      amount: order.amount,
      currency: order.currency,
      notes: order.notes,
      status: order.status,
    });

    const savedPayment = await paymentRecord.save();

    res.json({
      ...savedPayment.toJSON(),
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    res.status(500).send(err);
  }
});

PaymentRouter.post("/webhook", async (req, res) => {
  try {
    // req.body is a raw Buffer from express.raw()
    const rawBody = req.body.toString("utf8");
    console.log("Webhook received (raw):", rawBody);

    const signature = req.headers["x-razorpay-signature"];
    console.log("Webhook signature:", signature);

    if (!signature) {
      console.log("No signature found");
      return res.status(400).send("No signature");
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.log("Webhook secret not configured");
      return res.status(500).send("Webhook secret not configured");
    }

    const isWebhookValid = validateWebhookSignature(
      rawBody, // raw string, NOT parsed object
      signature,
      webhookSecret,
    );

    console.log("Webhook signature valid:", isWebhookValid);

    if (!isWebhookValid) {
      return res.status(400).send("Invalid signature");
    }

    // Parse the raw body to access event data
    const body = JSON.parse(rawBody);

    // Handle different webhook events
    const event = body.event;
    console.log("Webhook event:", event);

    if (event === "payment.captured") {
      const paymentDetails = body.payload.payment.entity;
      console.log("Payment details:", paymentDetails);

      const payment = await Payment.findOne({
        orderId: paymentDetails.order_id,
      });

      if (!payment) {
        console.log("Payment not found for order:", paymentDetails.order_id);
        return res.status(404).send("Payment not found");
      }

      console.log("Found payment:", payment);

      // Update payment status
      payment.status = "completed";
      await payment.save();

      // Update user premium status
      const user = await User.findOne({ _id: payment.userId });
      if (user) {
        console.log("Updating user:", user._id);
        user.isPremium = true;
        user.membershipType = payment.notes.membership_type;
        await user.save();
        console.log("User updated successfully");
      }
    }

    res.status(200).send("Webhook processed");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).send("Webhook processing failed");
  }
});

module.exports = PaymentRouter;
