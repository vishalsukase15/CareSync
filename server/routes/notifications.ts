import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Get current user notifications
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const notifs = db.schema.notifications.filter(n => n.userId === user.id);
  const unreadCount = notifs.filter(n => !n.isRead).length;

  return res.json({
    notifications: notifs.slice(0, 50),
    unreadCount
  });
});

// Mark single notification as read
router.patch('/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const notif = db.schema.notifications.find(n => n.id === req.params.id && n.userId === user.id);

  if (notif) {
    notif.isRead = true;
    db.scheduleSave();
  }

  return res.json({ success: true });
});

// Mark all as read
router.post('/mark-all-read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  db.schema.notifications.forEach(n => {
    if (n.userId === user.id) {
      n.isRead = true;
    }
  });
  db.scheduleSave();

  return res.json({ success: true });
});

export default router;
