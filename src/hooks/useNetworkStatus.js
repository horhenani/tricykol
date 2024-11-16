// src/hooks/useNetworkStatus.js
import { useState, useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isConnectionStable, setIsConnectionStable] = useState(true);

  useEffect(() => {
    let stabilityTimeout;
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);

      // Clear existing timeout
      if (stabilityTimeout) {
        clearTimeout(stabilityTimeout);
      }

      // Set connection stability after a delay
      stabilityTimeout = setTimeout(() => {
        setIsConnectionStable(state.isConnected);
      }, 2000);
    });

    return () => {
      unsubscribe();
      if (stabilityTimeout) {
        clearTimeout(stabilityTimeout);
      }
    };
  }, []);

  return { isConnected, isConnectionStable };
};
