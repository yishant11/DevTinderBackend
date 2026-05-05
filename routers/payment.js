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

    const signature = req.headers["x-razorpay-signature"];

    // req.body is a Buffer from express.raw() — convert to string (NOT JSON.stringify!)
    const rawBody = req.body.toString();

    const isWebhookValid = validateWebhookSignature(
      rawBody,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );

    console.log("Webhook is valid", isWebhookValid);

    if (!isWebhookValid) {
      return res.status(400).send("webhook Invalid signature");
    }

    // Parse the raw string to get usable JSON
    const body = JSON.parse(rawBody);

    // update payment status in db
    const paymentDetails = body.payload.payment.entity;

    const payment = await Payment.findOne({orderId:paymentDetails.order_id});
    payment.status = "completed";
    await payment.save();

    // update user as premium
    const user = await User.findOne({_id:payment.userId});
    user.isPremium = true;
    user.membershipType = payment.notes.membership_type;
    await user.save();

    // if (req.body.event === "payment.captured") {

    // }

    // if (req.body.event === "payment.failed") {

    // }

    return res.status(200).json({ message: "Webhook received successfully" })


  } catch (err) {
    return res.status(500).json({ message: "Internal server error" })

  }



});

module.exports = PaymentRouter;
