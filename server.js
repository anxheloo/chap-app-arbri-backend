const app = require("./app");
require("dotenv").config();
const User = require("./models/user");
const FriendRequest = require("./models/friendRequest");
const path = require("path");
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
  console.log("this is socket.handshake.query:", socket.handshake.query);
  const user_id = socket.handshake.query["user_id"];

  const socket_id = socket.id;

  console.log(`user connected ${socket_id}`);

  if (Boolean(user_id)) {
    await User.findByIdAndUpdate(user_id, {
      socket_id,
      status: "Online",
    });
  }

  // we can write our socket listeners here ...

  socket.on("friend_request", async (data) => {
    console.log("this is data from socket.on", data);
    console.log("this is data from socket.on data.to", data.to);

    // {to: "user id"}

    const to = await User.findById(data.to).select("socket_id");
    const from = await User.findById(data.from).select("socket_id");

    // create a friend request
    await FriendRequest.create({
      sender: data.from,
      recipient: data.to,
    });

    // emit event => create friend request

    io.to(to.socket_id).emit("new_friend_request", {
      //
      message: "New friend request received",
    });

    //emit event => request sent

    io.to(from.socket_id).emit("request_sent", {
      message: "Request sent successfully",
    });
  });

  socket.on("accept_request", async (data) => {
    console.log("this is data from socket.on", data);

    const request_doc = await FriendRequest.findById(data.request_id);

    console.log(request_doc);

    const sender = await User.findById(request_doc.sender);
    const receiver = await User.findById(request_doc.receiver);

    sender.friends.push(request_doc.recipient);
    receiver.friends.push(request_doc.sender);

    await receiver.save({ new: true, validateModifiedOnly: true });
    await sender.save({ new: true, validateModifiedOnly: true });

    await FriendRequest.findByIdAndDelete(data.request_id);

    io.to(sender.socket_id).emit("request_accepted", {
      message: "Friend request Accepted",
    });

    io.to(receiver.socket_id).emit("request_accepted", {
      message: "Friend request Accepted",
    });
  });

  // Handle incoming text/link messages
  socket.on("text_message", async (data) => {
    console.log("Received message:", data);

    // data: {to, from, text}

    const { message, conversation_id, from, to, type } = data;

    const to_user = await User.findById(to);
    const from_user = await User.findById(from);

    // message => {to, from, type, created_at, text, file}

    const new_message = {
      to: to,
      from: from,
      type: type,
      created_at: Date.now(),
      text: message,
    };

    // fetch OneToOneMessage Doc & push a new message to existing conversation
    const chat = await OneToOneMessage.findById(conversation_id);
    chat.messages.push(new_message);
    // save to db`
    await chat.save({ new: true, validateModifiedOnly: true });

    // emit incoming_message -> to user

    io.to(to_user?.socket_id).emit("new_message", {
      conversation_id,
      message: new_message,
    });

    // emit outgoing_message -> from user
    io.to(from_user?.socket_id).emit("new_message", {
      conversation_id,
      message: new_message,
    });
  });

  // handle Media/Document Message
  socket.on("file_message", (data) => {
    console.log("Received message:", data);

    // data: {to, from, text, file}

    // Get the file extension
    const fileExtension = path.extname(data.file.name);

    // Generate a unique filename
    const filename = `${Date.now()}_${Math.floor(
      Math.random() * 10000
    )}${fileExtension}`;

    // upload file to AWS s3

    // create a new conversation if its dosent exists yet or add a new message to existing conversation

    // save to db

    // emit incoming_message -> to user

    // emit outgoing_message -> from user
  });

  // -------------- HANDLE SOCKET DISCONNECTION ----------------- //

  socket.on("end", async (data) => {
    // Find user by ID and set status as offline

    if (data.user_id) {
      await User.findByIdAndUpdate(data.user_id, { status: "Offline" });
    }

    // broadcast to all conversation rooms of this user that this user is offline (disconnected)

    console.log("closing connection");
    socket.disconnect(0);
  });
});

// process.on("unhandledRejection", (error) => {
//   console.log(error);
//   server.close(() => {
//     process.exit(1);
//   });
// });
