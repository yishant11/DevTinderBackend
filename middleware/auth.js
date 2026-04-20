const jwt = require("jsonwebtoken");
const User = require("../src/model/User");
const auth = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({ message: "TOKEN IS NOT VALID !!!!!!" });
    }

    // verify token
    const decodeMessage = jwt.verify(token, "secret");
    const userId = decodeMessage.userId;
    
    // find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// const user = (req, res, next) => {
//   const token = "ishant";
//   if (token === "ishant") {
//     next();
//   } else {
//     res.status(401).json({ message: "Unauthorized" });
//   }
// };

module.exports = {
  auth,
  // user,
};
