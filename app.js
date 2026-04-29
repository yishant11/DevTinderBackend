import dotenv from "dotenv";
dotenv.config();
const express = require("express");
const app = express();
// const { auth,user } = require('./middleware/auth');
const connectDB = require("./config/db");
const User = require("././src/model/User.js");
app.use(express.json());
const { signupValidationsData } = require("./utils/validate");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { auth } = require("./middleware/auth");
const profileRouter = require("./routers/profileRouter");
const connectionRequestRouter = require("./routers/connectionRequest");
const userRouter = require("./routers/user");

const cors = require("cors");
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

connectDB();
app.use(express.json());
app.use(cookieParser());

// Use profile router
app.use("/profile", profileRouter);

// Use connection request router
app.use("/request", connectionRequestRouter);

// Use user router
app.use("/user", userRouter);

app.post("/signup", async (req, res) => {
  console.log("Request body:", req.body);
  // validate the data
  try {
    signupValidationsData(req);
    const { firstName, lastName, email, password, gender,age } = req.body;
    // encrypt the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create a new user with hashed password
    const user = new User({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: hashedPassword,
      gender: gender,
      age: age,
    });
    // save the user to the database
    const savedUser = await user.save();
    const token = await jwt.sign(
      {
        userId: user._id,
      },
      "secret",
      {
        expiresIn: "1h",
      },
    );
    console.log("Token:", token);

    // add token to the cookie and send back to the response

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return res.json({
      message: "User created successfully",
      user: savedUser,
    });

  } catch (error) {
    return res.status(400).send(error.message);
  }
});

app.post("/logout", auth, async (req, res) => {
  try {
    // Clear the cookie
    res.clearCookie("token");
    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Logout failed" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt with email:", email);

    const user = await User.findOne({
      email: email,
    });

    if (!user) {
      return res.status(400).send("User not found with email: " + email);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).send("Invalid password");
    }
    if (isPasswordValid) {
      // create a token
      const token = await jwt.sign(
        {
          userId: user._id,
        },
        "secret",
        {
          expiresIn: "1h",
        },
      );
      console.log("Token:", token);

      // add token to the cookie and send back to the response

      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      });
      return res.status(200).send(user);
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(400).send(error.message);
  }
});

app.get("/getprofile", auth, async (req, res) => {
  try {
    // Remove password from response for security
    const userResponse = req.user.toObject();
    delete userResponse.password;
    res.send(userResponse);
  } catch (error) {
    console.error(error);
  }
});

app.get("/userbyemail", auth, async (req, res) => {
  const email = req.body.email;
  try {
    const user = await User.find({ email: email });
    res.send(user);
  } catch (error) {
    console.error(error);
  }
});

app.get("/feed", async (req, res) => {
  try {
    const user = await User.find({});
    res.send(user);
  } catch (error) {
    console.error(error);
  }
});

app.delete("/deleteuser", async (req, res) => {
  const userId = req.body.userId;

  try {
    const deleteUser = await User.findByIdAndDelete(userId);
    res.send(deleteUser);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.patch("/userupdate", async (req, res) => {
  const userId = req.body.id;
  const { firstName, email } = req.body;

  try {
    // Check if only allowed fields are being updated
    const allowedFields = [
      "id",
      "firstName",
      "lastName",
      "email",
      "password",
      "age",
      "gender",
      "photoURL",
      "about",
    ];
    const requestFields = Object.keys(req.body);
    const invalidFields = requestFields.filter(
      (field) => !allowedFields.includes(field),
    );

    if (invalidFields.length > 0) {
      throw new Error(`Invalid fields detected: ${invalidFields.join(", ")}`);
    }

    console.log("Request fields:", requestFields);
    console.log("Invalid fields:", invalidFields);

    const userupdate = await User.findByIdAndUpdate(
      userId,
      { firstName, email },
      { new: true, runValidators: true },
    );
    console.log("User updated successfully");
    res.send(userupdate);
  } catch (e) {
    console.error(e);
    res.status(500).send("User update failed: " + e.message);
  }
});
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
