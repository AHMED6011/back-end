import mongoose from "mongoose";

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  expiryDate: {
    type: Date,
  },
  verified: Boolean,
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
