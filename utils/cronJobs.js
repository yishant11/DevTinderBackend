const cron = require("node-cron");
const { subDays, startOfDay, endOfDay } = require("date-fns");
const SendEmail = require("./sendEmail");
const ConnectionRequest = require("../src/model/ConnectionRequest");

cron.schedule("37 12 * * *", async () => {
  // send email to all users who got request in previous day
  try {
    const yesterday = subDays(new Date(), 1);
    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = endOfDay(yesterday);

    const previousDayRequests = await ConnectionRequest.find({
      status: "interested",
      createdAt: {
        $gte: yesterdayStart,
        $lt: yesterdayEnd,
      },
    }).populate("fromUserId toUserId");

    const listofEmails = new Set(
      previousDayRequests.map((req) => req.toUserId.email),
    );
    for (const email of listofEmails) {
      // send email
      const res = await SendEmail.run(
        "New fried request pending for" + email,
        "There are so many pending requests for you please login to devtinder.shop to view them in order to accept or reject them",
        email,
      );
      console.log(res);
    }
  } catch (error) {}
});

module.exports = cron;
