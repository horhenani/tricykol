// src/screens/chat/ChatListScreen.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Text, Avatar } from "react-native-paper";
import { colors, fonts } from "@constants/globalStyles";
import { ChatService } from "@services/ChatService";
import { useAuth } from "@context/AuthContext";
import { useDriverAuth } from "@context/DriverAuthContext";
import { format } from "date-fns";

const ChatListScreen = ({ navigation }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { driver } = useDriverAuth();
  const currentUser = user || driver;

  useEffect(() => {
    let unsubscribe;

    const loadChats = async () => {
      try {
        const userChats = await ChatService.getUserChats(currentUser.uid);
        setChats(userChats);

        // Subscribe to updates for each chat
        const unsubscribes = userChats.map((chat) =>
          ChatService.subscribeToChatUpdates(
            chat.id,
            currentUser.uid,
            (updatedChat) => {
              setChats((prev) =>
                prev.map((c) => (c.id === updatedChat.id ? updatedChat : c)),
              );
            },
          ),
        );

        unsubscribe = () => unsubscribes.forEach((unsub) => unsub());
      } catch (error) {
        console.error("Error loading chats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser?.uid]);

  const renderChatItem = ({ item }) => {
    const otherParticipant = Object.values(item.participants).find(
      (p) => p.id !== currentUser.uid,
    );

    if (!otherParticipant) return null;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() =>
          navigation.navigate("Chat", {
            bookingId: item.bookingId,
            otherUser: {
              id: otherParticipant.id,
              name: otherParticipant.name,
            },
          })
        }
      >
        <Avatar.Text
          size={50}
          label={otherParticipant.name[0].toUpperCase()}
          backgroundColor={colors.primary + "40"}
          color={colors.text}
        />

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.participantName}>{otherParticipant.name}</Text>
            {item.lastMessage && (
              <Text style={styles.timestamp}>
                {format(new Date(item.lastMessage.timestamp), "HH:mm")}
              </Text>
            )}
          </View>

          <View style={styles.lastMessage}>
            <Text style={styles.messageText} numberOfLines={1}>
              {item.lastMessage?.text || "No messages yet"}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unreadCount}</Text>
              </View>
            )}
          </View>

          <Text style={styles.bookingInfo}>
            {item.booking.pickup.address} → {item.booking.dropoff.address}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No conversations yet</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray + "20",
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.gray,
  },
  lastMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: colors.background,
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  bookingInfo: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.gray,
  },
});

export default ChatListScreen;
