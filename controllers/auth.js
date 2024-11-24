const User = require("../models/user");
// require("dotenv").config();
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const crypto = require("crypto");
const filterObject = require("../utils/filterObject");
const { promisify } = require("util");
const mailService = require("../services/mailer");
const otp = require("../templates/otp");
const resetPassword = require("../templates/resetPassword");

const signToken = (userId) => {
  return jwt.sign({ userId }, process.env.SECRET);
};

//Sign up => register - sendOTP - verifyOTP
exports.register = async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;

  const filteredBody = filterObject(
    req.body,
    "firstName",
    "lastName",
    "password",
    "email"
  );

  const existingUser = await User.findOne({ email: email });

  if (existingUser && existingUser.verified) {
    return res.status(400).json({
      status: "error",
      message: "User already exist, please log in!",
    });
  } else if (existingUser) {
    // if not verified than update prev one
    await User.findOneAndUpdate({ email: email }, filteredBody, {
      new: true,
      validateModifiedOnly: true,
    });

    // generate an otp and send to email
    req.userId = existingUser._id;
    next();
  } else {
    // if user is not created before than create a new one
    const new_user = await User.create(filteredBody);

    // generate an otp and send to email
    req.userId = new_user._id;
    next();
  }
};

exports.sendOTP = async (req, res, next) => {
  const { userId } = req;
  const new_otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
  });
  const otp_expiry_time = Date.now() + 10 * 60 * 1000; // 10 Mins after otp is sent
  const user = await User.findById(userId);
  user.otp_expiry_time = otp_expiry_time;
  user.otp = new_otp.toString();
  await user.save({ new: true, validateModifiedOnly: true });

  const msg = {
    from: "anxhelocenollari@gmail.com",
    to: user.email,
    subject: "Verification OTP",
    html: otp(user.firstName, new_otp),
    // html:"this is a simple email",
    attachments: [],
    text: "cabonemir",
  };

  // if (process.env.ENABLE_EMAIL_SENDING === "true") {
  await mailService.sendSGMail(msg);
  // }

  res.status(200).json({
    status: "success",
    message: "OTP Sent Successfully!",
  });
};

exports.verifyOTP = async (req, res, next) => {
  // verify otp and update the user record

  const { email, otp } = req.body;

  const user = await User.findOne({
    email: email,
    otp_expiry_time: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      status: "error",
      message: "Email is invalid or code expired.",
    });
  }

  if (!(await user.correctOTP(otp, user.otp))) {
    return res.status(400).json({
      status: "error",
      message: "OTP is incorrect",
    });
  }

  // OTP is correct
  user.verified = true;
  user.otp = undefined;

  await user.save({ new: true, validateModifiedOnly: true });

  const token = signToken(user._id);

  res.status(200).json({
    status: "success",
    message: "OTP verified successfully",
    token,
    userId: user._id,
  });
};

// login
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      status: "error",
      message: "Email and password are required",
    });
  }

  const user = await User.findOne({ email: email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return res.status(400).json({
      status: "error",
      message: "Email or password is incorrect",
    });
  }

  const token = signToken(user._id);

  res.status(200).json({
    status: "success",
    message: "Logged in successfully",
    token,
    user_id: user._id,
  });
};

exports.protect = async (req, res, next) => {
  console.log("this is token:", req.headers.authorization.split(" ")[1]);
  console.log("this is process.env.JWT_SECRET:", process.env.SECRET);

  // 1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  //   else {
  //     res.status(400).json({
  //       status: "error",
  //       message: "You are not logged in! Please log in to get access.",
  //     });
  //   }

  if (!token) {
    return res.status(401).json({
      message: "You are not logged in! Please log in to get access.",
    });
  }
  // 2) Verification of token
  const decoded = await promisify(jwt.verify)(token, process.env.SECRET);

  console.log(decoded);

  // 3) Check if user still exists

  const this_user = await User.findById(decoded.userId);
  if (!this_user) {
    return res.status(401).json({
      message: "The user belonging to this token does no longer exists.",
    });
  }
  // 4) Check if user changed password after the token was issued
  if (this_user.changedPasswordAfter(decoded.iat)) {
    return res.status(401).json({
      message: "User recently changed password! Please log in again.",
    });
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = this_user;
  next();
};

// Forgot password
exports.forgotPassword = async (req, res, next) => {
  // 1.get user email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(400).json({
      status: "error",
      message: "User does not exist with that email address",
    });
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send email to user with reset url
  try {
    console.log("this is reset token: ", resetToken);
    const resetURL = `http://localhost:3000/auth/new-password?token=${resetToken}`;

    const msg = {
      from: "anxhelocenollari@gmail.com",
      to: user.email,
      subject: "Password reset link",
      html: resetPassword(user.firstName, resetURL),
      // html:"this is a simple email",
      attachments: [],
      //  text: "cabonemir",
    };

    // if (process.env.ENABLE_EMAIL_SENDING === "true") {
    await mailService.sendSGMail(msg);

    return res.status(200).json({
      status: "success",
      message: "Reset password link sent to email!",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    res.status(500).json({
      status: "error",
      message: "Error occurred, try again!",
    });
  }
};

// reset password
exports.resetPassword = async (req, res, next) => {
  const { newPassword, confirmPassword, token } = req.body;

  // 1) Get user based on the token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return res.status(400).json({
      status: "error",
      message: "Token is Invalid or Expired",
    });
  }
  user.password = newPassword;
  user.passwordConfirm = confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // send an email to user informing about password reset

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  const newToken = signToken(user._id);

  res.status(200).json({
    status: "success",
    message: "Password Reset Successfully",
    token: newToken,
  });
};
