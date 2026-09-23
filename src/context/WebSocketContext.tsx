import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext.js';
import { Notification } from '../types/index.js';

type ListenerCallback = (data: any) => void;

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (type: string, payload: any, roomId?: string, recipientId?: string) => void;
  addListener: (eventType: string, callback: ListenerCallback) => () => void;
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  latestBedUpdate: any | null;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef<Map<string, Set<ListenerCallback>>>(new Map());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestBedUpdate, setLatestBedUpdate] = useState<any | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const res = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('caresync_token') || ''}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          if (user) {
            ws.send(JSON.stringify({
              type: 'AUTH',
              payload: { userId: user.id, role: user.role }
            }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const { type, payload } = data;

            if (type === 'NEW_NOTIFICATION') {
              setNotifications(prev => [payload, ...prev]);
              setUnreadCount(prev => prev + 1);
            } else if (type === 'ICU_BED_UPDATE') {
              setLatestBedUpdate(payload);
            }

            // Dispatch to registered event listeners
            const listeners = listenersRef.current.get(type);
            if (listeners) {
              listeners.forEach(cb => cb(payload));
            }
          } catch (e) {
            console.error('[WS Client] Error handling message:', e);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Try reconnect after 3 seconds
          reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          setIsConnected(false);
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [user]);

  const sendMessage = useCallback((type: string, payload: any, roomId?: string, recipientId?: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type,
        payload,
        roomId,
        recipientId
      }));
    }
  }, []);

  const addListener = useCallback((eventType: string, callback: ListenerCallback) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set());
    }
    listenersRef.current.get(eventType)!.add(callback);

    return () => {
      const set = listenersRef.current.get(eventType);
      if (set) {
        set.delete(callback);
      }
    };
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('caresync_token') || ''}`
        }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('caresync_token') || ''}`
        }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      // ignore
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        sendMessage,
        addListener,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications,
        latestBedUpdate
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
