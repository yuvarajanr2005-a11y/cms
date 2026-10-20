import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [activeToast, setActiveToast] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("smartcms_token");
    const socketServerUrl = import.meta.env.VITE_API_URL || window.location.origin;
    // Initialize socket connection
    const socketInstance = io(socketServerUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: true,
      auth: {
        token: token || undefined
      }
    });

    socketInstance.on("connect", () => {
      console.log("⚡ Real-time Socket connected:", socketInstance.id);
    });

    socketInstance.on("notification:new", (data) => {
      const newNotif = {
        id: Date.now() + Math.random(),
        ...data,
        receivedAt: new Date()
      };

      setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]);
      setActiveToast(newNotif);

      // Dismiss toast after 5s
      setTimeout(() => {
        setActiveToast((current) => (current?.id === newNotif.id ? null : current));
      }, 5000);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  const clearNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        activeToast,
        clearNotification,
        clearAllNotifications,
        dismissToast: () => setActiveToast(null)
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext) || {};
};
