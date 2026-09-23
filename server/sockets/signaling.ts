import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { db } from '../db/database.js';

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  userRole?: string;
  currentRoom?: string;
  isAlive?: boolean;
}

interface SocketMessage {
  type: string;
  payload: any;
  roomId?: string;
  recipientId?: string;
}

let wssInstance: WebSocketServer | null = null;
const userSockets = new Map<string, ExtendedWebSocket>();
const roomMembers = new Map<string, Set<ExtendedWebSocket>>();

export function setupWebSocketServer(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });
  wssInstance = wss;

  wss.on('connection', (ws: ExtendedWebSocket) => {
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (data: string) => {
      try {
        const parsed: SocketMessage = JSON.parse(data.toString());
        handleSocketEvent(ws, parsed);
      } catch (err) {
        console.error('[WS] Parse error:', err);
      }
    });

    ws.on('close', () => {
      if (ws.userId) {
        userSockets.delete(ws.userId);
      }
      if (ws.currentRoom) {
        leaveRoom(ws, ws.currentRoom);
      }
    });
  });

  // Heartbeat ping interval
  const interval = setInterval(() => {
    wss.clients.forEach((ws: any) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
}

function handleSocketEvent(ws: ExtendedWebSocket, msg: SocketMessage) {
  const { type, payload, roomId, recipientId } = msg;

  switch (type) {
    case 'AUTH': {
      if (payload?.userId) {
        ws.userId = payload.userId;
        ws.userRole = payload.role;
        userSockets.set(payload.userId, ws);
        sendToSocket(ws, 'AUTH_SUCCESS', { userId: ws.userId });
      }
      break;
    }

    case 'JOIN_CONSULTATION_ROOM': {
      const room = roomId || payload?.roomId;
      if (!room) return;
      
      // Leave previous room if any
      if (ws.currentRoom && ws.currentRoom !== room) {
        leaveRoom(ws, ws.currentRoom);
      }

      ws.currentRoom = room;
      if (!roomMembers.has(room)) {
        roomMembers.set(room, new Set());
      }
      roomMembers.get(room)!.add(ws);

      // Notify others in the room
      broadcastToRoom(room, 'PEER_JOINED', {
        userId: ws.userId,
        role: ws.userRole,
        totalInRoom: roomMembers.get(room)!.size
      }, ws);

      sendToSocket(ws, 'ROOM_JOINED', {
        roomId: room,
        existingParticipants: Array.from(roomMembers.get(room)!)
          .filter(m => m !== ws)
          .map(m => ({ userId: m.userId, role: m.userRole }))
      });
      break;
    }

    case 'LEAVE_CONSULTATION_ROOM': {
      const room = roomId || ws.currentRoom;
      if (room) {
        leaveRoom(ws, room);
      }
      break;
    }

    // WebRTC Signaling: Offer
    case 'WEBRTC_OFFER': {
      const room = roomId || ws.currentRoom;
      if (room) {
        broadcastToRoom(room, 'WEBRTC_OFFER', {
          senderId: ws.userId,
          offer: payload?.offer
        }, ws);
      }
      break;
    }

    // WebRTC Signaling: Answer
    case 'WEBRTC_ANSWER': {
      const room = roomId || ws.currentRoom;
      if (room) {
        broadcastToRoom(room, 'WEBRTC_ANSWER', {
          senderId: ws.userId,
          answer: payload?.answer
        }, ws);
      }
      break;
    }

    // WebRTC Signaling: ICE Candidate
    case 'WEBRTC_ICE_CANDIDATE': {
      const room = roomId || ws.currentRoom;
      if (room) {
        broadcastToRoom(room, 'WEBRTC_ICE_CANDIDATE', {
          senderId: ws.userId,
          candidate: payload?.candidate
        }, ws);
      }
      break;
    }

    // WebRTC Media toggles (camera on/off, mic on/off)
    case 'MEDIA_TOGGLE': {
      const room = roomId || ws.currentRoom;
      if (room) {
        broadcastToRoom(room, 'PEER_MEDIA_TOGGLE', {
          senderId: ws.userId,
          videoEnabled: payload?.videoEnabled,
          audioEnabled: payload?.audioEnabled
        }, ws);
      }
      break;
    }

    // Real-time Chat
    case 'SEND_CHAT_MESSAGE': {
      if (!ws.userId || !payload?.conversationId || !payload?.recipientId || !payload?.content) {
        return;
      }
      const newMsg = db.insertMessage({
        id: 'msg_' + Math.random().toString(36).substring(2, 11),
        conversationId: payload.conversationId,
        senderId: ws.userId,
        recipientId: payload.recipientId,
        content: payload.content.trim(),
        isRead: false,
        createdAt: new Date().toISOString()
      });

      // Send to sender for immediate confirmation
      sendToSocket(ws, 'CHAT_MESSAGE_SENT', newMsg);

      // Send to recipient if online
      const recipientWs = userSockets.get(payload.recipientId);
      if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
        sendToSocket(recipientWs, 'NEW_CHAT_MESSAGE', newMsg);
      }

      // Add in-app notification
      db.insertNotification({
        id: 'notif_' + Math.random().toString(36).substring(2, 11),
        userId: payload.recipientId,
        title: 'New Consultation Message',
        message: `You have received a new message regarding your consultation.`,
        type: 'CONSULTATION',
        link: '/chat',
        isRead: false,
        createdAt: new Date().toISOString()
      });
      break;
    }

    // Typing indicator
    case 'TYPING': {
      if (recipientId) {
        const recipientWs = userSockets.get(recipientId);
        if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
          sendToSocket(recipientWs, 'PEER_TYPING', {
            senderId: ws.userId,
            isTyping: payload?.isTyping
          });
        }
      }
      break;
    }

    default:
      break;
  }
}

function leaveRoom(ws: ExtendedWebSocket, room: string) {
  if (roomMembers.has(room)) {
    const members = roomMembers.get(room)!;
    members.delete(ws);
    if (members.size === 0) {
      roomMembers.delete(room);
    } else {
      broadcastToRoom(room, 'PEER_LEFT', { userId: ws.userId }, ws);
    }
  }
  ws.currentRoom = undefined;
}

export function sendToSocket(ws: WebSocket, type: string, payload: any) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, payload }));
  }
}

export function broadcastToRoom(room: string, type: string, payload: any, senderWs?: ExtendedWebSocket) {
  const members = roomMembers.get(room);
  if (!members) return;

  const data = JSON.stringify({ type, payload, roomId: room });
  members.forEach(member => {
    if (member !== senderWs && member.readyState === WebSocket.OPEN) {
      member.send(data);
    }
  });
}

export function broadcastBedUpdate(hospitalId: string, payload: any) {
  if (!wssInstance) return;
  const msg = JSON.stringify({
    type: 'ICU_BED_UPDATE',
    payload: { hospitalId, ...payload, updatedAt: new Date().toISOString() }
  });
  wssInstance.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

export function sendNotificationToUser(userId: string, notification: any) {
  const ws = userSockets.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    sendToSocket(ws, 'NEW_NOTIFICATION', notification);
  }
}
