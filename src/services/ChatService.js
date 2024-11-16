// src/services/ChatService.js
import database from "@react-native-firebase/database";
import firestore from "@react-native-firebase/firestore";

// Initialize database with URL
const db = database();
const ref = db.ref();

export const MessageStatus = {
  SENDING: "sending",
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
  ERROR: "error",
};

export const ChatService = {
  // Send message
  sendMessage: async (bookingId, senderId, message) => {
    try {
      // Get reference to messages
      const messagesRef = ref.child(`chats/${bookingId}/messages`);
      const newMessageRef = messagesRef.push();

      const messageData = {
        id: newMessageRef.key,
        senderId,
        text: message,
        timestamp: database.ServerValue.TIMESTAMP,
        status: MessageStatus.SENDING,
      };

      // Set new message
      await newMessageRef.set(messageData);

      // Update last message
      await ref.child(`chats/${bookingId}`).update({
        lastMessage: {
          text: message,
          timestamp: database.ServerValue.TIMESTAMP,
          senderId,
        },
      });

      // Update status to sent
      await newMessageRef.update({ status: MessageStatus.SENT });

      return newMessageRef.key;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  // Get chat history
  getChatHistory: async (chatId) => {
    try {
      const snapshot = await ref
        .child(`chats/${chatId}/messages`)
        .orderByChild("timestamp")
        .limitToLast(50)
        .once("value");

      const messages = [];
      snapshot.forEach((childSnapshot) => {
        messages.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });

      return messages.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error("Error getting chat history:", error);
      throw error;
    }
  },

  // Subscribe to messages
  subscribeToMessages: (chatId, callback) => {
    const messagesRef = ref.child(`chats/${chatId}/messages`);

    const onChildAdded = messagesRef.on("child_added", (snapshot) => {
      callback({
        id: snapshot.key,
        ...snapshot.val(),
      });
    });

    const onChildChanged = messagesRef.on("child_changed", (snapshot) => {
      callback(
        {
          id: snapshot.key,
          ...snapshot.val(),
        },
        "updated",
      );
    });

    // Return unsubscribe function
    return () => {
      messagesRef.off("child_added", onChildAdded);
      messagesRef.off("child_changed", onChildChanged);
    };
  },

  // Update message status
  updateMessageStatus: async (chatId, messageId, status) => {
    try {
      await ref
        .child(`chats/${chatId}/messages/${messageId}`)
        .update({ status });
    } catch (error) {
      console.error("Error updating message status:", error);
    }
  },

  // Get user chats
  getUserChats: async (userId) => {
    try {
      // Get bookings from Firestore
      const bookingsSnapshot = await firestore()
        .collection("bookings")
        .where("participants", "array-contains", userId)
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();

      const chatPromises = bookingsSnapshot.docs.map(async (doc) => {
        const booking = doc.data();
        const chatSnapshot = await ref.child(`chats/${doc.id}`).once("value");

        if (chatSnapshot.exists()) {
          const chatData = chatSnapshot.val();
          return {
            id: doc.id,
            bookingId: doc.id,
            lastMessage: chatData.lastMessage,
            participants: chatData.participants,
            booking: {
              status: booking.status,
              pickup: booking.pickup,
              dropoff: booking.dropoff,
            },
          };
        }
        return null;
      });

      const chats = (await Promise.all(chatPromises)).filter(Boolean);
      return chats.sort(
        (a, b) =>
          (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0),
      );
    } catch (error) {
      console.error("Error getting user chats:", error);
      throw error;
    }
  },

  // Subscribe to chat updates
  subscribeToChatUpdates: (chatId, userId, callback) => {
    const chatRef = ref.child(`chats/${chatId}`);

    const onValue = chatRef.on("value", (snapshot) => {
      if (snapshot.exists()) {
        callback({
          id: chatId,
          ...snapshot.val(),
        });
      }
    });

    return () => chatRef.off("value", onValue);
  },
};

export default ChatService;
