const app = require("./app");
require("dotenv").config();

const mongoose = require("mongoose");

process.on("uncaughtException", (error) => {
  console.log(error);
  process.exit(1);
});

const http = require("http");

const server = http.createServer(app);

const connect = () => {
  mongoose
    .connect(
      process.env.MONGODB
      // , {
      // useNewUrlParser: true,
      // useCreateIndex: true,
      // useFindAndModify: false,
      // useUnifiedTopology: true,
      // }
    )
    .then(() => console.log("DB CONNECTED"))
    .catch((error) => console.log("THIS IS ERROR:", error));
  // .catch((error) => throw error);
};

const port = process.env.PORT || 8000;

server.listen(port, () => {
  connect();
  console.log("CONNCETED");
});

// process.on("unhandledRejection", (error) => {
//   console.log(error);
//   server.close(() => {
//     process.exit(1);
//   });
// });
