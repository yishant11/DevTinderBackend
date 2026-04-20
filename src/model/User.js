const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      min: 18,
      max: 60,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      validate: {
        validator: function (value) {
          if (!["male", "female", "other"].includes(value)) {
            throw new Error("Invalid Gender");
          }
          return true;
        },
      },
    },
  },
  {
    timestamps: true,
  },
);

UserSchema.methods.getJWT = function () {
  const user = this;
  const token = jwt.sign(
    {
      userId: user._id,
    },
    {
      expiresIn: "1h",
    },
  );
  return token;
};

UserSchema.methods.validatePassword = async function (passwordInputByUser) {
  const user = this;
  const hashedPassword = user.password;

  const isPasswordValid = await bcrypt.compare(
    passwordInputByUser,
    hashedPassword,
  );

  return isPasswordValid;
};

module.exports = mongoose.model("User", UserSchema);
