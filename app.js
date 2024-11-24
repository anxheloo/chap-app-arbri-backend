const express = require("express");

const routes = require("./routes/index");

const morgan = require("morgan"); // http request logger middleware for node.js

const rateLimit = require("express-rate-limit");

const helmet = require("helmet"); //

const mongoSanitize = require("express-mongo-sanitize");

const bodyParser = require("body-parser");

const xss = require("xss");

const cors = require("cors");

const app = express();

//

// app.use(xss());

app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(mongoSanitize());

app.use(
  cors({
    // origin: "*",
    origin: "http://localhost:3000",
    methods: ["GET", "PATCH", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
const limiter = rateLimit({
  max: 3000,
  windowMs: 60 * 60 * 1000, // in one hour
  message: "Too many request from this IP, please try again in 1 hour",
});
app.use("/tawk", limiter);

app.use(routes);

module.exports = app;
