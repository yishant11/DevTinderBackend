const validator = require("validator");

const signupValidationsData = (req) => {
  const { firstName, lastName, email } = req.body;
  if (!firstName || !lastName) {
    throw new Error("First name and last name are required");
  } else if (!validator.isEmail(email)) {
    throw new Error("Email is invalid");
  }
};

const validateEditProfile = (req) => {
  // Check if req.body exists
  if (!req.body || typeof req.body !== "object") {
    return false;
  }

  const allowedFields = ["firstName", "lastName", "email", "age"];
  const isValid = Object.keys(req.body).every((key) =>
    allowedFields.includes(key),
  );
  return isValid;
};

module.exports = {
  signupValidationsData,
  validateEditProfile,
};
