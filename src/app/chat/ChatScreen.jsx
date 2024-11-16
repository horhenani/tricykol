import React, { useState, useEffect, useRef } from "react";
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, fonts } from "@constants/globalStyles";
import { ChatService, MessageStatus } from "@services/ChatService";
import { useAuth } from "@context/AuthContext";

const ChatScreen = ({ route }) => {
  const { bookingId, otherUser } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const flatListRef = useRef();

  useEffect(() => {
    let unsubscribe;

    const loadChat = async () => {
      try {
        setLoading(true);
        // Load chat history
        const history = await ChatService.getChatHistory(bookingId);
        setMessages(history);

        // Subscribe to new messages
        unsubscribe = ChatService.subscribeToMessages(
          bookingId,
          (newMessage, type) => {
            if (type === "updated") {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === newMessage.id ? newMessage : msg,
                ),
              );
            } else {
              setMessages((prev) => [...prev, newMessage]);
            }

            // Mark message as read if from other user
            if (newMessage.senderId !== user.uid) {
              ChatService.updateMessageStatus(
                bookingId,
                newMessage.id,
                MessageStatus.READ,
              );
            }
          },
        );
      } catch (error) {
        console.error("Error loading chat:", error);
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      loadChat();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [bookingId]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    try {
      await ChatService.sendMessage(bookingId, user.uid, inputText.trim());
      setInputText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.senderId === user.uid;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.messageTime}>
          {new Date(item.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Chat with {otherUser.name}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        contentContainerStyle={styles.messagesList}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <MaterialCommunityIcons
              name="send"
              size={24}
              color={inputText.trim() ? colors.primary : colors.gray}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray + "20",
  },
  headerText: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: "80%",
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
  },
  ownMessage: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary + "20",
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: colors.gray + "20",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  messageTime: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.gray,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray + "20",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray + "40",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontFamily: fonts.regular,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ChatScreen;
