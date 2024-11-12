const app = require("./app");
require("dotenv").config();
const User = require("./models/user");
const { Server } = require("socket.io");

const mongoose = require("mongoose");

process.on("uncaughtException", (error) => {
  console.log(error);
  console.log("uncaught exception! shutting down...");
  process.exit(1);
});

const http = require("http");
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET, POST"],
  },
});

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

io.on("connection", async (socket) => {
  console.log("this is socket:", socket);
  const user_id = socket.handshake.query["user_id"];

  const socket_id = socket.id;

  console.log(`user connected ${socket_id}`);

  if (user_id) {
    await User.findByIdAndUpdate(user_id, {
      socket_id,
    });
  }

  // we can write our socket listeners here ...

  socket.on("friend_request", async (data) => {
    console.log("this is data from socket.on", data);
    console.log("this is data from socket.on data.to", data.to);

    // {to: "user id"}

    const to = await User.findById(data.to);

    // create a friend request

    io.to(to.socket_id).emit("new_friend_request", {
      //
    });
  });
});

// process.on("unhandledRejection", (error) => {
//   console.log(error);
//   server.close(() => {
//     process.exit(1);
//   });
// });
