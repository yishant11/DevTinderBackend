const express = require("express");
const authRouter = express.Router();

// POST SIGNUP
authRouter.post("/signup", async (req, res) => {
  try {
    signupValidationsData(req);
    const { firstName, lastName, email, password } = req.body;

    // encrypt the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create a new user with hashed password
    const user = new User({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: hashedPassword,
    });

    // save the user to the database
    await user.save();

    return res.status(201).send("User created successfully");
    
  } catch (error) {
    return res.status(400).send(error.message);
  }

  // const user = new User(req.body);

  // try {
  //   await user.save();
  //   console.log("User saved successfully");
  // } catch (error) {
  //   console.error(error);
  // }

  // res.send("Signup successful");
});

// post login
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt with email:", email);

    const user = await User.findOne({
      email: email,
    });

    if (!user) {
      return res.status(400).send("User not found with email: " + email);
    }

    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      return res.status(400).send("Invalid password");
    }
    if (isPasswordValid) {
      // create a token
      const token = await user.getJWT();
      console.log("Token:", token);

      // add token to the cookie and send back to the response

      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
      return res.status(200).send("Login successful");
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(400).send(error.message);
  }
});

authRouter.post("/logout", (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
  });
  res.send("Logout successful");
});

module.exports = authRouter;
