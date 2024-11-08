require("dotenv").config();
// const sgMail = require("@sendgrid/mail");
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const nodemailer = require("nodemailer");

// console.log("this is key: ", process.env.SENDGRID_API_KEY);

// exports.sendSGMail = async ({ to, from, subject, html, attachments, text }) => {
exports.sendSGMail = async (msg) => {
  console.log("inside sendSMMail");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: "anxhelocenollari@gmail.com",
      pass: "xzvp sbuj fmml usru",
    },
  });

  try {
    const info = await transporter.sendMail({
      from: msg.from,
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
      attachments: msg.attachments,
    });

    // const response = await sgMail.send(msg);
    console.log("info response:", info);
    console.log("Email sent");
  } catch (error) {
    console.log("Error sending msg :", error);
  }
};

// exports.sendEmail = async (args) => {
//   console.log("inside sendEmail in mailer. 2 function");

//   // if (!process.env.NODE_ENV === "production") {
//   //   return Promise.resolve();
//   // } else {
//   return sendSGMail(args);
//   // }
// };
