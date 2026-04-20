const validator = require("validator");

const signupValidationsData = (req) => {
    const { firstName, lastName, email, gender } = req.body;
    if (!firstName || !lastName) {
        throw new Error("First name and last name are required");
    } else if (!validator.isEmail(email)) {
        throw new Error("Email is invalid");
    } else if (!gender) {
        throw new Error("Gender is required");
    }
};

const validateEditProfile = (req) => {
    // Check if req.body exists
    if (!req.body || typeof req.body !== 'object') {
        return false;
    }
    
    const allowedFields = ["firstName", "lastName", "email", "gender"];
    const isValid = Object.keys(req.body).every((key) => allowedFields.includes(key));
    return isValid;
};

module.exports = {
    signupValidationsData,
    validateEditProfile,
};
