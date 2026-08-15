import Notification from '../models/Notification.js';

// Helper called by other controllers to create notifications
export async function createNotification(recipientId, title, body, type = 'general') {
  try {
    await Notification.create({ recipient: recipientId, title, body, type });
  } catch (e) {
    console.error('Failed to create notification:', e.message);
  }
}

export async function listNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort('-createdAt')
      .limit(50);
    res.json(notifications);
  } catch (e) { next(e); }
}

export async function markRead(req, res, next) {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { readAt: new Date() },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    res.json(notif);
  } catch (e) { next(e); }
}

export async function markAllRead(req, res, next) {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, readAt: null },
      { readAt: new Date() }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (e) { next(e); }
}

export async function getUnreadCount(req, res, next) {
  try {
    const count = await Notification.countDocuments({ recipient: req.user.id, readAt: null });
    res.json({ count });
  } catch (e) { next(e); }
}
