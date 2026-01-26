const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
      maxlength: 100,
      minlength: 3,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      maxlength: 100,
      minlength: 3,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email"],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    mobile: {
      type: String,
      maxlength: 10,
      unique: true,
      required: true,
      trim: true,
      match: [/^[0-9]{10}$/, "Please enter a valid number"],
    },
    refreshToken: {
      type: String,
      default: null
    }
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;
