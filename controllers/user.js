const User = require("../models/user");
const FriendRequests = require("../models/friendRequest");
const filterObject = require("../utils/filterObject");

exports.updateMe = async (req, res, next) => {
  const { user } = req;

  const filteredBody = filterObject(
    req.body,
    "firstName",
    "lastName",
    "about",
    "avatar"
  );

  const updatedUser = await User.findByIdAndUpdate(user._id, filteredBody, {
    new: true,
    validateModifiedOnly: true,
  });

  res.status(200).json({
    status: "error",
    data: updatedUser,
    message: "Profile updated successfully",
  });
};

// exports.getUsers = async (req, res, next) => {
//   const all_users = await User.find({
//     verified: true,
//   }).select("firstName lastName _id avatar status ");

//   console.log("this is req.user._id :", req.user._id);

//   // const this_user = req.user;

//   // Fetch the current user with `friends` and `requestedTo`
//   const thisUser = await User.findById(req.user._id).select(
//     "friends requestedTo"
//   );

//   // Filter users and assign a `requestStatus`
//   const remainingUsers = all_users.map((user) => {
//     const isFriend = thisUser.friends.includes(user._id);
//     const isRequested = thisUser.requestedTo.includes(user._id);
//     const isSelf = user._id.toString() === req.user._id.toString();

//     if (isSelf) return null; // Exclude self
//     if (isFriend) return null; // Exclude friends

//     return {
//       ...user.toObject(),
//       requestStatus: isRequested ? "pending" : "available", // Add request status
//     };
//   });

//   console.log("this is req.user inside getUsers:", req.user);
//   console.log("this is remainingUsers:", remainingUsers);

//   // const remainingUsers = all_users.filter(
//   //   (user) =>
//   //     !this_user.friends.includes(user._id) &&
//   //     user._id.toString() !== req.user._id.toString()
//   // );

//   // const users = all_users.map((user) => ({
//   //   ...user.toObject(),
//   //   isRequestSent: currentUser.requestedTo.includes(user._id), // Check if the request was sent
//   // }));

//   // Remove null entries from the filtered list
//   const filteredUsers = remainingUsers.filter((user) => user !== null);

//   res.status(200).json({
//     status: "success",
//     data: filteredUsers,
//     message: "Users found successfully!",
//   });
// };

exports.getUsers = async (req, res, next) => {
  const all_users = await User.find({
    verified: true,
  }).select("firstName lastName _id");

  const this_user = req.user;

  console.log("this is req.user:", req.user);

  const remaining_users = all_users.filter(
    (user) =>
      !this_user.friends.includes(user._id) &&
      user._id.toString() !== req.user._id.toString()
  );

  return res.status(200).json({
    status: "success",
    data: remaining_users,
    message: "Users found successfully!",
  });
};

// exports.getUsers = async (req, res, next) => {
//   try {
//     const all_users = await User.find({ verified: true }).select(
//       "firstName lastName _id avatar"
//     );

//     const this_user = await User.findById(req.user._id).select(
//       "friends requestedTo"
//     );

//     console.log("Current user data:", this_user);

//     const remaining_users = all_users.map((user) => {
//       if (this_user.friends.includes(user._id)) {
//         return null; // Exclude friends
//       }
//       if (this_user.requestedTo.includes(user._id)) {
//         return { ...user.toObject(), requestStatus: "pending" }; // Mark as pending
//       }
//       if (user._id.toString() === req.user._id.toString()) {
//         return null; // Exclude the current user
//       }
//       return { ...user.toObject(), requestStatus: "available" }; // Default status
//     });

//     const filteredUsers = remaining_users.filter((user) => user !== null); // Remove null entries

//     return res.status(200).json({
//       status: "success",
//       data: filteredUsers,
//       message: "Users found successfully!",
//     });
//   } catch (error) {
//     console.error("Error in getUsers controller:", error);
//     res.status(500).json({
//       status: "error",
//       message: "Failed to retrieve users",
//     });
//   }
// };

exports.getAllVerifiedUsers = async (req, res, next) => {
  const all_users = await User.find({
    verified: true,
  }).select("firstName lastName _id");

  const remaining_users = all_users.filter(
    (user) => user._id.toString() !== req.user._id.toString()
  );

  return res.status(200).json({
    status: "success",
    data: remaining_users,
    message: "Users found successfully!",
  });
};

exports.getRequests = async (req, res, next) => {
  const requests = await FriendRequests.find({ recipient: req.user._id })
    .populate("sender")
    .select("_id firstName lastName");

  console.log("this is requests:", requests);

  res.status(200).json({
    status: "success",
    data: requests,
    message: "Requests found successfully!",
  });
};

exports.getFriends = async (req, res, next) => {
  const this_user = await User.findById(req.user._id).populate(
    "friends",
    "_id firstName lastName"
  );

  const friends = await FriendRequests.find({ status: "approved" });

  res.status(200).json({
    status: "success",
    data: this_user.friends,
    // data: friends,
    message: "Friends found successfully!",
  });
};
