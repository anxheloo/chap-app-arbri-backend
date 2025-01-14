const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");
// const crypto = require("crypto");

const requestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },

  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },

  status: {
    type: String,
    default: "pending",
  },

  createdAt: {
    type: Date,
    default: Date.now(),
  },

  //   firstName: {
  //     type: String,
  //     required: [true, "First Name is required"],
  //   },
  //   lastName: {
  //     type: String,
  //     required: [true, "Last Name is required"],
  //   },
  //   about: {
  //     type: String,
  //   },
  //   avatar: {
  //     type: String,
  //   },
  //   email: {
  //     type: String,
  //     required: [true, "Email is required"],
  //     validate: {
  //       validator: function (email) {
  //         return String(email)
  //           .toLowerCase()
  //           .match(
  //             /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  //           );
  //       },
  //       message: (props) => `Email (${props.value}) is invalid!`,
  //     },
  //   },
  //   password: {
  //     // unselect
  //     type: String,
  //   },
  //   passwordChangedAt: {
  //     // unselect
  //     type: Date,
  //   },
  //   passwordResetToken: {
  //     // unselect
  //     type: String,
  //   },
  //   passwordResetExpires: {
  //     // unselect
  //     type: Date,
  //   },
  //   createdAt: {
  //     type: Date,
  //     default: Date.now(),
  //   },
  //   updatedAt: {
  //     // unselect
  //     type: Date,
  //   },
  //   verified: {
  //     type: Boolean,
  //     default: false,
  //   },
  //   otp: {
  //     type: String,
  //   },
  //   otp_expiry_time: {
  //     type: Date,
  //   },
  //   friends: [
  //     {
  //       type: mongoose.Schema.ObjectId,
  //       ref: "User",
  //     },
  //   ],
  //   socket_id: {
  //     type: String,
  //   },
  //   status: {
  //     type: String,
  //     enum: ["Online", "Offline"],
  //   },
});

const FriendRequest = new mongoose.model("FriendRequest", requestSchema);
module.exports = FriendRequest;
