// Importing Required Modules and packages
const chat = require("../models/chat");
const activeUsers = require("../models/active");
// Function to handle personal Chats(The helper function stores message in database , marks them as unread and then send them to receiver if the user is online
module.exports.SendPersonalMessage = async function (io, userId, data) {
  console.log("Message Received ,", data.ChatId, data.Receiver, data.Content);
  const chatId = data.ChatId;
  //  Checking if the user is active
  const receiver = await activeUsers.findOne({ user: data.Receiver });
  console.log(receiver);
  const ReceiverId = data.Receiver;
  console.log(ReceiverId);

  // Making new Map for the read status of Map
  const ReadStatusMap = new Map();
  ReadStatusMap.set(userId, "Read"); 
  ReadStatusMap.set(ReceiverId, "Unread");


  // // Checking if chat already existed or is a new one
  if (chatId !== "New") {
    // If it alredy exists then adding a new message
    const privateChat = await chat.findOne({_id : chatId});
    console.log(privateChat);
    privateChat.Messages.push({
      Sender: userId,
      Content: data.Content,
      ReadStatus: ReadStatusMap,
      Timestamp: Date.now(),
    });
    const undread_msg = privateChat.Participants.get(ReceiverId)
    privateChat.Participants.set(ReceiverId,undread_msg + 1)
    privateChat.LastChat = Date.now();
    await privateChat.save();
    // console.log(privateChat)
  } else {
    // Making new Map so that It give me freedom to store userId actually
    const participantsMap = new Map();
    participantsMap.set(userId, 0); 
    participantsMap.set(ReceiverId, 1);
    // If chat is not valid , then create a new chat
    const new_chat = await chat.create({
      Type: "Personal",
      Participants: participantsMap,
      Messages: [
        {
          Sender: userId,
          Content: data.Content,
          ReadStatus: ReadStatusMap,
          CreatedAt: Date.now(),
        },
      ],
      LastChat: Date.now(),
    });
  }
  // If the user is active sending it message thorugh socket for real time communication
  if (receiver) {
    // Receive-personal-message event will be transmitted to receiver with the senderId and chatId and the messafe Receievd
    console.log("Sendign message to receiver", receiver.socket)
    io.to("TxFLHBTMsNRyCM0TAAAF").emit("receive-personal-message", {
      ChatId : chatId,
      Sender : userId,
      Content: data.Content,
    },(data)=>{
      console.log("Data Sent Successfully",data)
    });
  }
};
// Function to handle status of message(This function is hit when a user read a message in the chat so we need to set unread meessage of that user to 0 and update status of individual message in the chat that were marked as unread earlier)
module.exports.ReadPersonalMessage = async function (io, userId, data) {
  //  Handling marking message in the chat as read

  // In the end sending acknowledgement to the sender to mark the message as read
  const socketId = "";
  // Find Socket Id with the associated user if he is active
  io.to(socketId).emit("read-message-ack", {
    ChatId: data.ChatId,
    Sender: userId,
  });
};
