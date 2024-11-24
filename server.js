const app = require("./app");
require("dotenv").config();
const User = require("./models/user");
const FriendRequest = require("./models/friendRequest");
const OneToOneMessage = require("./models/OneToOneMessage");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const mongoose = require("mongoose");

process.on("uncaughtException", (error) => {
  console.log(error);
  console.log("uncaught exception! shutting down...");
  process.exit(1);
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// io.on("connection", async (socket) => {
//   console.log("this is socket:", socket);
//   const user_id = socket.handshake.query.user_id;

//   console.log(`User connected ${socket.id}`);
//   console.log(`User connected with id ${user_id}`);

//   if (!user_id) {
//     console.error("User ID is missing in query parameters.");
//     return;
//   }

//   if (user_id != null && Boolean(user_id)) {
//     try {
//       User.findByIdAndUpdate(user_id, {
//         socket_id: socket.id,
//         status: "Online",
//       });
//     } catch (e) {
//       console.log(e);
//     }
//   }

//   // const socket_id = socket.id;

//   // console.log(`user connected ${socket_id}`);

//   // We can write our socket event listeners in here...
//   // socket.on("friend_request", async (data) => {
//   //   // console.log("inside friend_request");
//   //   console.log("Received friend_request with data:", data);

//   //   const existingRequest = await FriendRequest.findOne({
//   //     sender: data.from,
//   //     recipient: data.to,
//   //   });

//   //   if (existingRequest) {
//   //     io.to(socket.id).emit("request_sent", {
//   //       message: "Friend request already sent!",
//   //     });
//   //     return;
//   //   }

//   //   const to = await User.findById(data.to).select("socket_id");
//   //   const from = await User.findById(data.from).select("socket_id");

//   //   // create a friend request
//   //   await FriendRequest.create({
//   //     sender: from,
//   //     recipient: to,
//   //   });

//   //   // Update `requestedTo` in the sender's document
//   //   await User.findByIdAndUpdate(
//   //     from,
//   //     { $addToSet: { requestedTo: to } },
//   //     { new: true }
//   //   );

//   //   // Notify the recipient
//   //   io.to(to?.socket_id).emit("new_friend_request", {
//   //     message: "New friend request received",
//   //   });

//   //   // Notify the sender
//   //   io.to(from?.socket_id).emit("request_sent", {
//   //     message: "Request Sent successfully!",
//   //   });
//   // });

//   socket.on("friend_request", async (data) => {
//     const existingRequest = await FriendRequest.findOne({
//       sender: data.from,
//       recipient: data.to,
//     });

//     if (existingRequest) {
//       io.to(socket.id).emit("request_sent", {
//         message: "Friend request already sent!",
//       });
//       return;
//     }

//     const to = await User.findById(data.to).select("socket_id");
//     const from = await User.findById(data.from).select("socket_id");

//     // create a friend request
//     await FriendRequest.create({
//       sender: data.from,
//       recipient: data.to,
//     });
//     // emit event request received to recipient
//     io.to(to?.socket_id).emit("new_friend_request", {
//       message: "New friend request received",
//     });
//     io.to(from?.socket_id).emit("request_sent", {
//       message: "Request Sent successfully!",
//     });
//   });

//   socket.on("accept_request", async (data) => {
//     // accept friend request => add ref of each other in friends array
//     console.log(data);
//     const request_doc = await FriendRequest.findById(data.request_id);

//     console.log(request_doc);

//     const sender = await User.findById(request_doc.sender);
//     const receiver = await User.findById(request_doc.recipient);

//     sender.friends.push(request_doc.recipient);
//     receiver.friends.push(request_doc.sender);

//     await receiver.save({ new: true, validateModifiedOnly: true });
//     await sender.save({ new: true, validateModifiedOnly: true });

//     await FriendRequest.findByIdAndDelete(data.request_id);

//     // delete this request doc
//     // emit event to both of them

//     // emit event request accepted to both
//     io.to(sender?.socket_id).emit("request_accepted", {
//       message: "Friend Request Accepted",
//     });
//     io.to(receiver?.socket_id).emit("request_accepted", {
//       message: "Friend Request Accepted",
//     });
//   });

//   // socket.on("get_direct_conversations", async ({ user_id }, callback) => {
//   //   const existing_conversations = await OneToOneMessage.find({
//   //     participants: { $all: [user_id] },
//   //   }).populate("participants", "firstName lastName avatar _id email status");

//   //   // db.books.find({ authors: { $elemMatch: { name: "John Smith" } } })

//   //   console.log(existing_conversations);

//   //   callback(existing_conversations);
//   // });

//   socket.on("get_direct_conversations", async ({ user_id }, callback) => {
//     const existing_conversations = await OneToOneMessage.find({
//       participants: { $all: [user_id] },
//     }).populate("participants", "firstName lastName _id email status");

//     console.log("this is existing conversation:", existing_conversations);

//     callback(existing_conversations);
//   });

//   socket.on("start_conversation", async (data) => {
//     // data: {to: from:}

//     const { to, from } = data;

//     // check if there is any existing conversation

//     const existing_conversations = await OneToOneMessage.find({
//       participants: { $size: 2, $all: [to, from] },
//     }).populate("participants", "firstName lastName _id email status");

//     console.log(existing_conversations[0], "Existing Conversation");

//     // if no => create a new OneToOneMessage doc & emit event "start_chat" & send conversation details as payload
//     if (existing_conversations.length === 0) {
//       let new_chat = await OneToOneMessage.create({
//         participants: [to, from],
//       });

//       new_chat = await OneToOneMessage.findById(new_chat).populate(
//         "participants",
//         "firstName lastName _id email status"
//       );

//       console.log(new_chat);

//       socket.emit("start_chat", new_chat);
//     }
//     // if yes => just emit event "start_chat" & send conversation details as payload
//     else {
//       socket.emit("start_chat", existing_conversations[0]);
//     }
//   });

//   socket.on("get_messages", async (data, callback) => {
//     try {
//       const { messages } = await OneToOneMessage.findById(
//         data.conversation_id
//       ).select("messages");
//       callback(messages);
//     } catch (error) {
//       console.log(error);
//     }
//   });

//   // Handle incoming text/link messages
//   socket.on("text_message", async (data) => {
//     console.log("Received message:", data);

//     // data: {to, from, message, conversation_id, type}

//     const { message, conversation_id, from, to, type } = data;

//     const to_user = await User.findById(to);
//     const from_user = await User.findById(from);

//     // message => {to, from, type, created_at, text, file}

//     const new_message = {
//       to: to,
//       from: from,
//       type: type,
//       text: message,
//       created_at: Date.now(),
//     };

//     // fetch OneToOneMessage Doc & push a new message to existing conversation
//     const chat = await OneToOneMessage.findById(conversation_id);

//     chat.messages.push(new_message);

//     // save to db`
//     await chat.save({ new: true, validateModifiedOnly: true });

//     // emit incoming_message -> to user
//     io.to(to_user?.socket_id).emit("new_message", {
//       conversation_id,
//       message: new_message,
//     });

//     // emit outgoing_message -> from user
//     io.to(from_user?.socket_id).emit("new_message", {
//       conversation_id,
//       message: new_message,
//     });
//   });

//   // handle Media/Document Message
//   socket.on("file_message", (data) => {
//     console.log("Received message:", data);

//     // data: {to, from, text, file}

//     // Get the file extension
//     const fileExtension = path.extname(data.file.name);

//     // Generate a unique filename
//     const filename = `${Date.now()}_${Math.floor(
//       Math.random() * 10000
//     )}${fileExtension}`;

//     // upload file to AWS s3

//     // create a new conversation if its dosent exists yet or add a new message to existing conversation

//     // save to db

//     // emit incoming_message -> to user

//     // emit outgoing_message -> from user
//   });

//   // -------------- HANDLE SOCKET DISCONNECTION ----------------- //

//   socket.on("end", async (data) => {
//     // Find user by ID and set status as offline

//     if (data.user_id) {
//       console.log("this is data.userid:", data.user_id);
//       await User.findByIdAndUpdate(data.user_id, { status: "Offline" });
//     }

//     // broadcast to all conversation rooms of this user that this user is offline (disconnected)

//     console.log("closing connection");
//     socket.disconnect(0);
//   });
// });

io.on("connection", async (socket) => {
  console.log("Client connected:", socket.id);

  const user_id = socket.handshake.query.user_id;
  console.log("Client connected with id  = user_id:", user_id);

  // const existingUser = await User.findByIdAndUpdate(
  //   user_id,
  //   { socket_id: socket.id },
  //   {
  //     new: true,
  //   }
  // );

  // 1. save socket id for logged in user and change status to online
  if (user_id != null) {
    try {
      const existingUser = await User.findByIdAndUpdate(user_id, {
        socket_id: socket.id,
        status: "Online",
      });
      console.log("this is updated user: ", existingUser);
    } catch (e) {
      console.log(e);
    }
  }

  socket.on("friend_request", async (data) => {
    // console.log("inside friend_request");
    console.log("Received friend_request with data:", data);

    const existingRequest = await FriendRequest.findOne({
      sender: data.from,
      recipient: data.to,
    });

    if (existingRequest) {
      io.to(socket.id).emit("request_sent", {
        message: "Friend request already sent!",
      });
      return;
    }

    const to = await User.findById(data.to).select("socket_id");
    const from = await User.findById(data.from).select("socket_id");

    console.log("this is to: ", to);
    console.log("this is from :", from);

    // create a friend request
    await FriendRequest.create({
      sender: from,
      recipient: to,
      // status: "pending"
    });

    // Update `requestedTo` in the sender's document
    await User.findByIdAndUpdate(
      to,
      { $addToSet: { requests: from } },
      { new: true }
    );

    // Notify the recipient
    io.to(to?.socket_id).emit("new_friend_request", {
      message: "New friend request received",
    });

    // Notify the sender
    io.to(from?.socket_id).emit("request_sent", {
      message: "Request Sent successfully!",
    });
  });

  socket.on("accept_request", async (data) => {
    console.log(" request accepted, this is data: ", data);

    // find request
    const request = await FriendRequest.findById(data.id);
    console.log(" this is request:", request);

    // change status to approved
    request.status = "approved";
    await request.save();

    // find request end delete
    //     const request = await FriendRequest.findByIdAndDelete(data).then((d) => {
    // console.log("this is d:", d);
    // console.log("successfully deleted:", d);
    //     }).catch(err => console.log("this is err from deleting friend request"));

    // update users friends array
    const user = await User.findById();

    const to = await User.findById(data.id).select("socket_id");
    const from = await User.findById(data.id).select("socket_id");
    // accept friend request => add ref of each other in friends array
    // console.log(data);
    // const request_doc = await FriendRequest.findById(data.request_id);

    // console.log(request_doc);

    // const sender = await User.findById(request_doc.sender);
    // const receiver = await User.findById(request_doc.recipient);

    // sender.friends.push(request_doc.recipient);
    // receiver.friends.push(request_doc.sender);

    // await receiver.save({ new: true, validateModifiedOnly: true });
    // await sender.save({ new: true, validateModifiedOnly: true });

    // await FriendRequest.findByIdAndDelete(data.request_id);

    // // delete this request doc
    // // emit event to both of them

    // // emit event request accepted to both
    // io.to(sender?.socket_id).emit("request_accepted", {
    //   message: "Friend Request Accepted",
    // });
    // io.to(receiver?.socket_id).emit("request_accepted", {
    //   message: "Friend Request Accepted",
    // });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
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

// process.on("unhandledRejection", (error) => {
//   console.log(error);
//   server.close(() => {
//     process.exit(1);
//   });
// });
