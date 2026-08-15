import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Complaint from '../models/Complaint.js';
import { createNotification } from './notificationController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `complaint-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
});

export async function createComplaint(req, res, next) {
  try {
    const { title, category, description, address, latitude, longitude, priority } = req.body;
    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    const complaint = await Complaint.create({
      citizen: req.user.id,
      title,
      category,
      description,
      location: { address, latitude: parseFloat(latitude) || 0, longitude: parseFloat(longitude) || 0 },
      images,
      priority: priority || 'medium',
      timeline: [{ status: 'open', note: 'Complaint registered successfully.' }],
    });

    res.status(201).json(complaint);
  } catch (e) { next(e); }
}

export async function listComplaints(req, res, next) {
  try {
    const filter = req.user.role === 'citizen' ? { citizen: req.user.id } : {};
    const complaints = await Complaint.find(filter)
      .populate('citizen', 'name email phone')
      .populate('assignedDriver', 'name phone')
      .sort('-createdAt');
    res.json(complaints);
  } catch (e) { next(e); }
}

export async function getComplaint(req, res, next) {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('citizen', 'name email phone')
      .populate('assignedDriver', 'name phone');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json(complaint);
  } catch (e) { next(e); }
}

export async function updateComplaint(req, res, next) {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    const prevStatus = complaint.status;
    const { status, assignedDriver, resolutionNote } = req.body;

    if (status && status !== prevStatus) {
      complaint.status = status;
      complaint.timeline.push({
        status,
        time: new Date(),
        note: resolutionNote || `Status updated to ${status}`,
      });

      // Notify citizen when status changes
      const notifMessages = {
        assigned: 'Your complaint has been assigned to a driver.',
        in_progress: 'A driver is on the way to resolve your complaint.',
        resolved: 'Your complaint has been resolved. Thank you!',
        closed: 'Your complaint has been closed.',
      };
      if (notifMessages[status]) {
        await createNotification(
          complaint.citizen,
          `Complaint ${status === 'resolved' ? 'Resolved ✅' : 'Updated'}`,
          `${complaint.title}: ${notifMessages[status]}`,
          'complaint'
        );
      }
    }

    if (assignedDriver !== undefined) complaint.assignedDriver = assignedDriver || null;

    await complaint.save();
    res.json(await complaint.populate(['citizen', 'assignedDriver']));
  } catch (e) { next(e); }
}

export async function getStats(req, res, next) {
  try {
    const citizenId = req.user.id;
    const [total, resolved, pending, inProgress] = await Promise.all([
      Complaint.countDocuments({ citizen: citizenId }),
      Complaint.countDocuments({ citizen: citizenId, status: 'resolved' }),
      Complaint.countDocuments({ citizen: citizenId, status: 'open' }),
      Complaint.countDocuments({ citizen: citizenId, status: 'in_progress' }),
    ]);
    res.json({ total, resolved, pending, inProgress });
  } catch (e) { next(e); }
}
