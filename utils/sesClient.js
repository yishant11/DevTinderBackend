const { SESClient } = require("@aws-sdk/client-ses");

console.log("AWS KEY:", process.env.AWS_ACCESS_KEY);
console.log("AWS SECRET:", process.env.AWS_SECRET_KEY);
// make sure this is way of passing credentials in v3
const sesClient = new SESClient({

  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

module.exports = sesClient;
