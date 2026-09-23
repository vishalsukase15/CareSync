import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { Message } from '../db/types.js';

const router = Router();

// Get all conversations for current user
router.get('/conversations', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;

  const userConversations = db.schema.conversations.filter(c => 
    c.participant1Id === user.id || c.participant2Id === user.id
  );

  const enriched = userConversations.map(c => {
    const otherUserId = c.participant1Id === user.id ? c.participant2Id : c.participant1Id;
    const otherUser = db.findUserById(otherUserId);
    const lastMsg = db.schema.messages
      .filter(m => m.conversationId === c.id)
      .slice(-1)[0];

    const unreadCount = db.schema.messages.filter(
      m => m.conversationId === c.id && m.recipientId === user.id && !m.isRead
    ).length;

    let doctorInfo = null;
    if (otherUser?.role === 'DOCTOR') {
      const doc = db.getDoctorProfileByUserId(otherUser.id);
      if (doc) doctorInfo = { specialization: doc.specialization };
    }

    return {
      ...c,
      otherParticipant: otherUser ? {
        id: otherUser.id,
        fullName: otherUser.fullName,
        role: otherUser.role,
        avatarUrl: otherUser.avatarUrl,
        doctorInfo
      } : null,
      lastMessage: lastMsg || null,
      unreadCount
    };
  });

  enriched.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

  return res.json({ conversations: enriched });
});

// Get or start conversation with another user
router.post('/conversations', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { recipientId } = req.body;

  if (!recipientId) {
    return res.status(400).json({ error: 'Recipient ID is required.' });
  }

  const recipient = db.findUserById(recipientId);
  if (!recipient) {
    return res.status(404).json({ error: 'Recipient user not found.' });
  }

  const conv = db.getOrCreateConversation(user.id, recipient.id);
  return res.json({ conversation: conv });
});

// Get messages in a conversation (Strict participant authorization)
router.get('/conversations/:id/messages', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const conv = db.schema.conversations.find(c => c.id === req.params.id);

  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found.' });
  }

  if (conv.participant1Id !== user.id && conv.participant2Id !== user.id && user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden. You are not a member of this conversation.' });
  }

  // Mark unread messages as read
  db.schema.messages.forEach(m => {
    if (m.conversationId === conv.id && m.recipientId === user.id && !m.isRead) {
      m.isRead = true;
    }
  });
  db.scheduleSave();

  const messages = db.schema.messages.filter(m => m.conversationId === conv.id);
  return res.json({ messages });
});

export default router;
